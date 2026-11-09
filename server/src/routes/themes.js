import { Router } from 'express';
import { z } from 'zod';
import { admin } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { loadProfile } from '../middleware/profile.js';

const router = Router();
router.use(requireAuth, loadProfile);

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use a color like #3347ff.').transform((v) => v.toLowerCase());

const schema = z.object({
  preset: z.enum(['light', 'dark', 'minimal', 'professional', 'gradient', 'creative']),
  background_color: hex,
  text_color: hex,
  button_color: hex,
  button_style: z.enum(['rounded', 'pill', 'square', 'outline']),
  font_family: z.enum(['sans', 'serif', 'mono', 'display']),
  layout_style: z.enum(['card', 'flat', 'glass']),
  profile_image_shape: z.enum(['circle', 'rounded', 'square']),
  link_card_style: z.enum(['filled', 'outline', 'shadow']),
});

// Every profile gets a theme row at signup; this repairs the link if it is ever missing.
async function ensureTheme(profileId) {
  const { data } = await admin.from('themes').select('*').eq('profile_id', profileId).maybeSingle();
  if (data) return data;
  const { data: created, error } = await admin.from('themes').insert({ profile_id: profileId }).select().single();
  if (error) throw error;
  await admin.from('profiles').update({ theme_id: created.id }).eq('id', profileId);
  return created;
}

router.get('/', async (req, res) => {
  try { res.json({ theme: await ensureTheme(req.profileId) }); }
  catch { res.status(500).json({ error: 'Could not load your theme.' }); }
});

router.put('/', validate(schema), async (req, res) => {
  try {
    await ensureTheme(req.profileId);
    const { data, error } = await admin.from('themes').update(req.body).eq('profile_id', req.profileId).select().single();
    if (error) throw error;
    res.json({ theme: data });
  } catch { res.status(500).json({ error: 'Could not save your theme.' }); }
});

export default router;
