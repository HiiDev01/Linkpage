import { z } from 'zod';

export const RESERVED = new Set(['admin','api','login','register','dashboard','forgot-password','reset-password',
  'settings','support','help','about','terms','privacy','linkpage','www','app','null','undefined','me']);

export const httpUrl = z.string().max(2000, 'URL is too long.').url('Enter a full URL, like https://example.com')
  .refine((v) => /^https?:\/\//i.test(v), 'URL must start with http:// or https://');

// Optional text: '' / null / missing all become null, anything else is validated by `schema`.
export const opt = (schema) => z.string().trim().nullish().transform((v) => v || null).pipe(schema.nullable());
export const optText = (max, label = 'This field') => opt(z.string().max(max, `${label} must be ${max} characters or fewer.`));

export const uuid = z.string().uuid();

export const username = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{2,29}$/, 'Username must be 3–30 characters: letters, numbers, hyphens or underscores.')
  .refine((v) => !RESERVED.has(v), 'That username is reserved.');

export const PLATFORM_HOSTS = {
  instagram: ['instagram.com'], facebook: ['facebook.com', 'fb.com'], linkedin: ['linkedin.com'],
  x: ['x.com', 'twitter.com'], tiktok: ['tiktok.com'], youtube: ['youtube.com', 'youtu.be'],
  github: ['github.com'], whatsapp: ['wa.me', 'whatsapp.com'], telegram: ['t.me', 'telegram.me'], website: null,
};

// Images must come from LinkPage's own storage. This stops pages from embedding third-party images,
// which would reveal visitors' IP addresses to whoever hosts them.
export const storageUrl = z.string().max(2000).refine(
  (v) => v.startsWith(`${process.env.SUPABASE_URL}/storage/v1/object/public/`),
  'Use an image uploaded through LinkPage.'
);
