import { admin } from '../supabase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });

  req.user = data.user;
  req.token = token;
  next();
}

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const first = result.error.issues[0];
    return res.status(400).json({ error: first.message, field: first.path[0] });
  }
  req.body = result.data;
  next();
};
