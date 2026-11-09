import { Router } from 'express';
import { z } from 'zod';
import { admin } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { loadProfile } from '../middleware/profile.js';
import { httpUrl, uuid, PLATFORM_HOSTS } from '../lib/validators.js';

const router = Router();
router.use(requireAuth, loadProfile);

const base = z.object({
  platform: z.enum(Object.keys(PLATFORM_HOSTS)),
  url: z.string().trim().pipe(httpUrl),
  is_visible: z.boolean().default(true),
}).superRefine((v, ctx) => {
  const hosts = PLATFORM_HOSTS[v.platform];
  if (!hosts) return;
  let host = '';
  try { host = new URL(v.url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return; }
  if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
    ctx.addIssue({ code: 'custom', path: ['url'], message: `That doesn’t look like a ${v.platform} link. Use a URL on ${hosts.join(' or ')}.` });
  }
});

const idParam = (req, res, next) => (uuid.safeParse(req.params.id).success ? next() : res.status(400).json({ error: 'Invalid id.' }));

router.get('/', async (req, res) => {
  const { data, error } = await admin.from('social_links').select('*').eq('profile_id', req.profileId).order('created_at');
  if (error) return res.status(500).json({ error: 'Could not load your social links.' });
  res.json({ social_links: data });
});

router.post('/', validate(base), async (req, res) => {
  const { data, error } = await admin.from('social_links').insert({ ...req.body, profile_id: req.profileId }).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'You already added that platform. Edit it instead.', field: 'platform' });
    return res.status(500).json({ error: 'Could not add the social link.' });
  }
  res.status(201).json({ social_link: data });
});

router.put('/:id', idParam, validate(base), async (req, res) => {
  const { data, error } = await admin.from('social_links').update(req.body)
    .eq('id', req.params.id).eq('profile_id', req.profileId).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'You already added that platform.', field: 'platform' });
    return res.status(500).json({ error: 'Could not save the social link.' });
  }
  if (!data) return res.status(404).json({ error: 'Social link not found.' });
  res.json({ social_link: data });
});

router.delete('/:id', idParam, async (req, res) => {
  const { data, error } = await admin.from('social_links').delete()
    .eq('id', req.params.id).eq('profile_id', req.profileId).select('id').maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not delete the social link.' });
  if (!data) return res.status(404).json({ error: 'Social link not found.' });
  res.json({ ok: true });
});

export default router;
