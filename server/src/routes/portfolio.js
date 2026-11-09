import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { admin } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { loadProfile } from '../middleware/profile.js';
import { httpUrl, opt, optText, uuid, storageUrl } from '../lib/validators.js';
import { sniff } from '../lib/images.js';

const router = Router();
router.use(requireAuth, loadProfile);

const schema = z.object({
  title: z.string().trim().min(1, 'Enter a project title.').max(100, 'Title must be 100 characters or fewer.'),
  description: optText(1000, 'Description'),
  image_url: opt(storageUrl),
  project_url: opt(httpUrl),
  technologies: z.array(z.string().trim().min(1).max(30, 'Each technology must be 30 characters or fewer.')).max(12, 'Add up to 12 technologies.')
    .default([]).transform((a) => [...new Set(a)]),
});

const idParam = (req, res, next) => (uuid.safeParse(req.params.id).success ? next() : res.status(400).json({ error: 'Invalid id.' }));

router.get('/', async (req, res) => {
  const { data, error } = await admin.from('portfolio_projects').select('*').eq('profile_id', req.profileId).order('display_order');
  if (error) return res.status(500).json({ error: 'Could not load your projects.' });
  res.json({ projects: data });
});

// Project image upload: raw bytes, 5 MB max. Returns the public URL to store on the project.
router.post('/image', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(415).json({ error: 'Upload a JPG, PNG or WebP image.' });
  const kind = sniff(req.body);
  if (!kind) return res.status(415).json({ error: 'That file isn’t a valid JPG, PNG or WebP image.' });
  const path = `${req.user.id}/project-${Date.now()}.${kind.ext}`;
  const bucket = admin.storage.from('portfolio');
  const { error } = await bucket.upload(path, req.body, { contentType: kind.type });
  if (error) return res.status(500).json({ error: 'Could not upload the image.' });
  res.json({ url: bucket.getPublicUrl(path).data.publicUrl });
});

router.post('/', validate(schema), async (req, res) => {
  const { data: last } = await admin.from('portfolio_projects').select('display_order').eq('profile_id', req.profileId)
    .order('display_order', { ascending: false }).limit(1);
  const display_order = last?.length ? last[0].display_order + 1 : 0;
  const { data, error } = await admin.from('portfolio_projects').insert({ ...req.body, profile_id: req.profileId, display_order }).select().single();
  if (error) return res.status(500).json({ error: 'Could not add the project.' });
  res.status(201).json({ project: data });
});

router.put('/:id', idParam, validate(schema), async (req, res) => {
  const { data, error } = await admin.from('portfolio_projects').update(req.body)
    .eq('id', req.params.id).eq('profile_id', req.profileId).select().maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not save the project.' });
  if (!data) return res.status(404).json({ error: 'Project not found.' });
  res.json({ project: data });
});

router.delete('/:id', idParam, async (req, res) => {
  const { data, error } = await admin.from('portfolio_projects').delete()
    .eq('id', req.params.id).eq('profile_id', req.profileId).select('id').maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not delete the project.' });
  if (!data) return res.status(404).json({ error: 'Project not found.' });
  res.json({ ok: true });
});

export default router;
