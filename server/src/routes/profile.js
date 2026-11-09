import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { admin } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { httpUrl, opt, optText, username } from '../lib/validators.js';
import { sniff } from '../lib/images.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await admin.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (error) return res.status(500).json({ error: 'Could not load your profile.' });
  res.json({ profile: data });
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your name.').max(80, 'Name must be 80 characters or fewer.'),
  username,
  professional_title: optText(100, 'Title'),
  bio: optText(500, 'Bio'),
  location: optText(100, 'Location'),
  contact_email: opt(z.string().toLowerCase().email('Enter a valid contact email.')),
  phone: opt(z.string().regex(/^\+?[\d\s().-]{6,25}$/, 'Enter a valid phone number.')),
  website: opt(httpUrl),
});

router.put('/me', requireAuth, validate(profileSchema), async (req, res) => {
  const { data, error } = await admin.from('profiles').update(req.body).eq('user_id', req.user.id).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That username is taken.', field: 'username' });
    return res.status(500).json({ error: 'Could not save your profile.' });
  }
  res.json({ profile: data });
});

// Avatar upload: raw image bytes in the body. The type is checked from the file's own bytes, not the header.
router.post('/avatar', requireAuth,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(415).json({ error: 'Upload a JPG, PNG or WebP image.' });
    const kind = sniff(req.body);
    if (!kind) return res.status(415).json({ error: 'That file isn’t a valid JPG, PNG or WebP image.' });

    const folder = req.user.id;
    const path = `${folder}/avatar-${Date.now()}.${kind.ext}`;
    const bucket = admin.storage.from('avatars');
    const { error: upErr } = await bucket.upload(path, req.body, { contentType: kind.type });
    if (upErr) return res.status(500).json({ error: 'Could not upload your photo.' });

    const url = bucket.getPublicUrl(path).data.publicUrl;
    const { data, error } = await admin.from('profiles').update({ profile_image: url }).eq('user_id', req.user.id).select().single();
    if (error) return res.status(500).json({ error: 'Could not save your photo.' });

    // Best-effort cleanup of earlier avatars
    const { data: files } = await bucket.list(folder);
    const old = (files || []).map((f) => `${folder}/${f.name}`).filter((p) => p !== path);
    if (old.length) await bucket.remove(old).catch(() => {});

    res.json({ profile: data });
  });

// Publishing. Only published profiles are reachable through GET /:username.
router.post('/publish', requireAuth, async (req, res) => {
  const { data: current } = await admin.from('profiles').select('full_name').eq('user_id', req.user.id).single();
  if (!current?.full_name?.trim()) return res.status(400).json({ error: 'Add your name to your profile before publishing.' });
  const { data, error } = await admin.from('profiles').update({ is_published: true }).eq('user_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: 'Could not publish your page.' });
  res.json({ profile: data });
});

router.post('/unpublish', requireAuth, async (req, res) => {
  const { data, error } = await admin.from('profiles').update({ is_published: false }).eq('user_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: 'Could not unpublish your page.' });
  res.json({ profile: data });
});

// Public: no auth. Explicit column lists mean private fields (user_id, ids of the profile) never leave the server.
// Unpublished and nonexistent profiles return the same 404 so drafts can't be discovered.
router.get('/:username', async (req, res) => {
  const name = String(req.params.username).toLowerCase();
  const notFound = () => res.status(404).json({ error: 'This page doesn’t exist or isn’t published yet.' });
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(name)) return notFound();

  const { data: p, error } = await admin.from('profiles')
    .select('id, username, full_name, bio, professional_title, profile_image, location, contact_email, phone, website, is_published')
    .eq('username', name).maybeSingle();
  if (error) return res.status(500).json({ error: 'Something went wrong on our side.' });
  if (!p || !p.is_published) return notFound();

  const [links, socials, projects, theme] = await Promise.all([
    admin.from('links').select('id, title, url, description, icon, thumbnail, is_active').eq('profile_id', p.id).eq('is_active', true).order('display_order'),
    admin.from('social_links').select('id, platform, url, is_visible').eq('profile_id', p.id).eq('is_visible', true).order('created_at'),
    admin.from('portfolio_projects').select('id, title, description, image_url, project_url, technologies').eq('profile_id', p.id).order('display_order'),
    admin.from('themes').select('preset, background_color, text_color, button_color, button_style, font_family, layout_style, profile_image_shape, link_card_style').eq('profile_id', p.id).maybeSingle(),
  ]);
  if (links.error || socials.error || projects.error || theme.error) return res.status(500).json({ error: 'Something went wrong on our side.' });

  const { id: _id, is_published: _pub, ...profile } = p;
  res.set('Cache-Control', 'public, max-age=15');
  res.json({ profile, theme: theme.data, links: links.data, social_links: socials.data, projects: projects.data });
});

export default router;
