import { Router } from 'express';
import { z } from 'zod';
import { admin } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { loadProfile } from '../middleware/profile.js';
import { httpUrl, opt, optText, uuid, storageUrl } from '../lib/validators.js';

const router = Router();
router.use(requireAuth, loadProfile);

const linkSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(100, 'Title must be 100 characters or fewer.'),
  url: z.string().trim().pipe(httpUrl),
  description: optText(200, 'Description'),
  icon: optText(40, 'Icon'),
  thumbnail: opt(storageUrl),
  is_active: z.boolean().default(true),
});

const idParam = (req, res, next) => (uuid.safeParse(req.params.id).success ? next() : res.status(400).json({ error: 'Invalid id.' }));

router.get('/', async (req, res) => {
  const { data, error } = await admin.from('links').select('*').eq('profile_id', req.profileId).order('display_order');
  if (error) return res.status(500).json({ error: 'Could not load your links.' });
  res.json({ links: data });
});

router.post('/', validate(linkSchema), async (req, res) => {
  const { data: last } = await admin.from('links').select('display_order').eq('profile_id', req.profileId)
    .order('display_order', { ascending: false }).limit(1);
  const display_order = last?.length ? last[0].display_order + 1 : 0;
  const { data, error } = await admin.from('links').insert({ ...req.body, profile_id: req.profileId, display_order }).select().single();
  if (error) return res.status(500).json({ error: 'Could not add the link.' });
  res.status(201).json({ link: data });
});

// Must come before /:id routes
router.patch('/reorder', validate(z.object({ ids: z.array(uuid).max(500) })), async (req, res) => {
  const { data: mine, error } = await admin.from('links').select('id').eq('profile_id', req.profileId);
  if (error) return res.status(500).json({ error: 'Could not reorder links.' });
  const owned = new Set(mine.map((l) => l.id));
  const ids = req.body.ids;
  if (ids.length !== owned.size || new Set(ids).size !== ids.length || !ids.every((i) => owned.has(i))) {
    return res.status(400).json({ error: 'The list of links is out of date. Refresh and try again.' });
  }
  const results = await Promise.all(ids.map((id, i) =>
    admin.from('links').update({ display_order: i }).eq('id', id).eq('profile_id', req.profileId)));
  if (results.some((r) => r.error)) return res.status(500).json({ error: 'Could not reorder links.' });
  res.json({ ok: true });
});

router.put('/:id', idParam, validate(linkSchema), async (req, res) => {
  const { data, error } = await admin.from('links').update(req.body)
    .eq('id', req.params.id).eq('profile_id', req.profileId).select().maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not save the link.' });
  if (!data) return res.status(404).json({ error: 'Link not found.' });
  res.json({ link: data });
});

router.delete('/:id', idParam, async (req, res) => {
  const { data, error } = await admin.from('links').delete()
    .eq('id', req.params.id).eq('profile_id', req.profileId).select('id').maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not delete the link.' });
  if (!data) return res.status(404).json({ error: 'Link not found.' });
  res.json({ ok: true });
});

export default router;
