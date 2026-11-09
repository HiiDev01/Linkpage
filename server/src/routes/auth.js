import { Router } from 'express';
import { z } from 'zod';
import { admin, anonClient } from '../supabase.js';
import { requireAuth, validate } from '../middleware/auth.js';
import { RESERVED } from '../lib/validators.js';

const router = Router();
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];


const email = z.string().trim().toLowerCase().email('Enter a valid email address.');
const password = z.string().min(8, 'Use at least 8 characters.').max(72, 'Use 72 characters or fewer.');
const username = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{2,29}$/, 'Username must be 3–30 characters: letters, numbers, hyphens or underscores.');

const session = (s) => s && ({ access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at });
const publicUser = (u) => ({ id: u.id, email: u.email });

router.get('/username-available/:username', async (req, res) => {
  const parsed = username.safeParse(req.params.username);
  if (!parsed.success) return res.json({ available: false, reason: parsed.error.issues[0].message });
  if (RESERVED.has(parsed.data)) return res.json({ available: false, reason: 'That username is reserved.' });
  const { data } = await admin.from('profiles').select('id').eq('username', parsed.data).maybeSingle();
  res.json({ available: !data, reason: data ? 'That username is taken.' : null });
});

router.post('/register',
  validate(z.object({ email, password, username, full_name: z.string().trim().min(1, 'Enter your name.').max(80) })),
  async (req, res) => {
    const { email, password, username, full_name } = req.body;
    if (RESERVED.has(username)) return res.status(409).json({ error: 'That username is reserved.', field: 'username' });

    const { data: taken } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
    if (taken) return res.status(409).json({ error: 'That username is taken.', field: 'username' });

    const { data, error } = await anonClient().auth.signUp({
      email, password,
      options: { data: { username, full_name }, emailRedirectTo: `${CLIENT_URL}/login` },
    });
    if (error) {
      if (/database error/i.test(error.message)) return res.status(409).json({ error: 'That username is taken.', field: 'username' });
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json({
      user: data.user && publicUser(data.user),
      session: session(data.session),
      needsConfirmation: !data.session,
    });
  });

router.post('/login',
  validate(z.object({ email, password: z.string().min(1, 'Enter your password.') })),
  async (req, res) => {
    const { data, error } = await anonClient().auth.signInWithPassword(req.body);
    if (error) {
      const unconfirmed = /not confirmed/i.test(error.message);
      return res.status(401).json({ error: unconfirmed ? 'Confirm your email first. Check your inbox.' : 'Incorrect email or password.' });
    }
    res.json({ user: publicUser(data.user), session: session(data.session) });
  });

router.post('/refresh', validate(z.object({ refresh_token: z.string().min(1) })), async (req, res) => {
  const { data, error } = await anonClient().auth.refreshSession({ refresh_token: req.body.refresh_token });
  if (error || !data.session) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  res.json({ user: publicUser(data.user), session: session(data.session) });
});

router.post('/logout', requireAuth, async (req, res) => {
  await admin.auth.admin.signOut(req.token).catch(() => {});
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const { data: profile, error } = await admin.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (error) return res.status(500).json({ error: 'Could not load your profile.' });
  res.json({ user: publicUser(req.user), profile });
});

// Same answer whether or not the email exists, so it can't be used to discover accounts.
router.post('/forgot-password', validate(z.object({ email })), async (req, res) => {
  await anonClient().auth.resetPasswordForEmail(req.body.email, { redirectTo: `${CLIENT_URL}/reset-password` });
  res.json({ message: 'If that email has an account, a reset link is on its way.' });
});

// The reset link lands on the client with a recovery access_token in the URL hash.
router.post('/reset-password',
  validate(z.object({ access_token: z.string().min(1), password })),
  async (req, res) => {
    const { data, error } = await admin.auth.getUser(req.body.access_token);
    if (error || !data?.user) return res.status(401).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
    const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, { password: req.body.password });
    if (updateError) return res.status(400).json({ error: updateError.message });
    res.json({ message: 'Password updated. You can sign in now.' });
  });

export default router;
