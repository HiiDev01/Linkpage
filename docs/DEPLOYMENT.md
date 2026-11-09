# Deployment

You deploy three pieces: Supabase (already hosted), the API (Node), and the client (static files).

## 1. Supabase (production)
1. Run `001_schema.sql`, then `002_analytics_functions.sql` in the SQL Editor.
2. Authentication > URL Configuration: set **Site URL** to your client URL (e.g. `https://linkpage.com`) and add `https://linkpage.com/reset-password` to Redirect URLs.
3. Turn **Confirm email** on.
4. Authentication > SMTP: set up your own email provider. Supabase's built-in sender is heavily rate-limited and meant for testing.
5. Keep the `service_role` key secret. Only the API gets it.

## 2. API (Render, Railway, Fly.io or any Node host)
- Root directory: `server`. Build: `npm install`. Start: `npm start`. Node 20.6 or newer.
- Environment variables:
  ```
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  CLIENT_URL=https://linkpage.com        # comma-separate to allow more origins (e.g. www)
  ```
  The host provides `PORT`. Serve the API over HTTPS only.
- `trust proxy` is set to 1 (one proxy hop), which is right for Render/Railway/Fly. If you put another proxy or CDN in front, adjust it in `src/index.js` or rate limiting will see the wrong client IP.
- Check: `GET https://api.yourdomain.com/api/health` returns `{"ok":true}`.

## 3. Client (Vercel, Netlify or Cloudflare Pages)
- Root directory: `client`. Build: `npm run build`. Output: `dist`.
- Environment variable: `VITE_API_URL=https://api.yourdomain.com` (no trailing slash, no `/api`).
- Single-page-app fallback is required so `/yourname` serves the app. Included: `vercel.json` and `public/_redirects` (Netlify/Cloudflare).

## 4. Domain
Point your domain at the client host. Put the API on a subdomain (`api.`). Update `CLIENT_URL` and Supabase Site URL to match.

## 5. Recommended response headers for the client host
Add these where your host allows (replace the API origin):
```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://YOUR-PROJECT.supabase.co; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'none'
```

## Pre-launch checklist
- [ ] `.env` files are not committed. The service-role key appears nowhere in `client/`.
- [ ] `npm test` passes against the production-like environment (use throwaway accounts).
- [ ] Confirmation and reset emails arrive from your own sender.
- [ ] Both migrations applied. RLS is enabled on all six tables (Table Editor shows the shield icon).
- [ ] Publish a test page, scan its QR code on a phone, then unpublish.
