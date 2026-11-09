import { Router } from 'express';
import { z } from 'zod';
import { admin } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { loadProfile } from '../middleware/profile.js';
import { uuid } from '../lib/validators.js';

const router = Router();

// Privacy: an event is just (profile, optional link, type, timestamp). No IP, user agent, referrer or visitor id is stored.

// If the caller is signed in as the page's owner, don't count their own visits.
async function isOwner(req, ownerId) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return false;
  const { data } = await admin.auth.getUser(h.slice(7));
  return data?.user?.id === ownerId;
}

router.post('/view',
  validate(z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,29}$/) })),
  async (req, res) => {
    const { data: p } = await admin.from('profiles').select('id, user_id, is_published').eq('username', req.body.username).maybeSingle();
    if (!p || !p.is_published) return res.status(404).json({ error: 'Not found.' });
    if (await isOwner(req, p.user_id)) return res.json({ counted: false });
    const { error } = await admin.from('analytics').insert({ profile_id: p.id, event_type: 'view' });
    if (error) return res.status(500).json({ error: 'Could not record the view.' });
    res.status(201).json({ counted: true });
  });

router.post('/click', validate(z.object({ link_id: uuid })), async (req, res) => {
  const { data: l } = await admin.from('links')
    .select('id, profile_id, is_active, profiles!inner(user_id, is_published)').eq('id', req.body.link_id).maybeSingle();
  if (!l || !l.is_active || !l.profiles.is_published) return res.status(404).json({ error: 'Not found.' });
  if (await isOwner(req, l.profiles.user_id)) return res.json({ counted: false });
  const { error } = await admin.from('analytics').insert({ profile_id: l.profile_id, link_id: l.id, event_type: 'click' });
  if (error) return res.status(500).json({ error: 'Could not record the click.' });
  res.status(201).json({ counted: true });
});

const query = z.object({
  days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d), 'days must be 7, 30 or 90').default(30),
  tz: z.coerce.number().int().min(-840).max(840).default(0),
});

router.get('/overview', requireAuth, loadProfile, async (req, res) => {
  const q = query.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.issues[0].message });
  const { days, tz } = q.data;
  const pid = req.profileId;
  const total = (type) => admin.from('analytics').select('id', { count: 'exact', head: true }).eq('profile_id', pid).eq('event_type', type);

  const [daily, top, views, clicks] = await Promise.all([
    admin.rpc('analytics_daily', { p_profile: pid, p_days: days, p_tz_offset: tz }),
    admin.rpc('analytics_top_links', { p_profile: pid, p_days: days }),
    total('view'), total('click'),
  ]);
  if (daily.error || top.error || views.error || clicks.error) {
    return res.status(500).json({ error: 'Could not load analytics. Make sure migration 002 has been applied.' });
  }
  const rows = daily.data.map((r) => ({ day: r.day, views: Number(r.views), clicks: Number(r.clicks) }));
  res.json({
    totals: { views: views.count ?? 0, clicks: clicks.count ?? 0 },
    range: { days, views: rows.reduce((s, r) => s + r.views, 0), clicks: rows.reduce((s, r) => s + r.clicks, 0) },
    daily: rows,
    top_links: top.data.filter((l) => Number(l.clicks) > 0).slice(0, 5).map((l) => ({ ...l, clicks: Number(l.clicks) })),
  });
});

router.get('/links', requireAuth, loadProfile, async (req, res) => {
  const q = query.pick({ days: true }).safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.issues[0].message });
  const [top, recent] = await Promise.all([
    admin.rpc('analytics_top_links', { p_profile: req.profileId, p_days: q.data.days }),
    admin.from('analytics').select('created_at, link_id').eq('profile_id', req.profileId).eq('event_type', 'click')
      .order('created_at', { ascending: false }).limit(20),
  ]);
  if (top.error || recent.error) return res.status(500).json({ error: 'Could not load link analytics.' });
  const links = top.data.map((l) => ({ ...l, clicks: Number(l.clicks) }));
  const titles = new Map(links.map((l) => [l.link_id, l.title]));
  res.json({
    days: q.data.days,
    links,
    recent: recent.data.map((r) => ({ created_at: r.created_at, link_id: r.link_id, title: titles.get(r.link_id) || 'Deleted link' })),
  });
});

export default router;
