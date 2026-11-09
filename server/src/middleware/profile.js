import { admin } from '../supabase.js';

// Resolves the signed-in user's profile id. Every query for owned data filters on req.profileId,
// which is what stops one user from reading or changing another user's rows.
export async function loadProfile(req, res, next) {
  const { data, error } = await admin.from('profiles').select('id').eq('user_id', req.user.id).single();
  if (error || !data) return res.status(404).json({ error: 'Profile not found.' });
  req.profileId = data.id;
  next();
}
