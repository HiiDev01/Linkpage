# LinkPage

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor: run `supabase/migrations/001_schema.sql`, then `002_analytics_functions.sql`.
3. Authentication > URL Configuration: set Site URL to `http://localhost:5173` and add `http://localhost:5173/reset-password` to Redirect URLs.
4. Authentication > Providers > Email: keep "Confirm email" on for production (turn off while testing if you like).
5. Project Settings > API: copy the URL, anon key and service_role key.

## 2. Run the API
```
cd server
cp .env     # fill in the three Supabase values
npm install
npm run dev             # http://localhost:${PORT} you can set your own port in the server folder env 
```

## 3. Run the client
```
cd client
npm install
npm run dev             # http://localhost:5173 (proxies /api to your backend url)
```

## Try it
Register, confirm your email, log in, refresh the page (you stay signed in), log out, then test "Forgot your password?".
Check `profiles` and `themes` in Supabase: a row for each is created automatically at signup by a database trigger.

## Security notes
- The service-role key lives only in `server/.env`. The client never talks to Supabase directly.
- The API uses the service role (bypasses RLS), so every query is scoped to `req.user.id`. RLS is still enabled as a second layer.
- Helmet, CORS allow-list, rate limits (stricter on auth routes), Zod validation, and a generic forgot-password reply are in place.

## Next
Stage 2: profile editing, links, social links.

## Stage 2 additions
- API: `PUT /api/profile/me`, `POST /api/profile/avatar`, links CRUD + `PATCH /api/links/reorder`, social links CRUD.
- Avatars upload through the API (raw image body, max 2 MB, type checked from file bytes) into the `avatars` bucket under `<user_id>/`.
- Every owned-resource query filters on the signed-in user's profile id; another user's ids return 404.
- Reorder with the arrow buttons. Toggle visibility with the switch.
- Duplicate usernames are blocked by the live check, the API, and a unique index.

## Stage 3 additions
- API: portfolio CRUD + `POST /api/portfolio/image` (5 MB, bytes-checked), `GET/PUT /api/themes` (colors must be `#rrggbb`; styles are enums).
- `ProfileView` is the single renderer for a LinkPage. The live preview uses it now and the public page will reuse it in Stage 4, so what you preview is what visitors see.
- Theme settings: background/text/button colors, button shape, link card style, font, image shape, page layout. Presets overwrite all settings; nothing is public until Stage 4 publishing.
- Images uploaded in the project form but never saved remain in storage (small; a cleanup job can come later).

## Stage 4 additions
- API: `POST /api/profile/publish`, `POST /api/profile/unpublish`, public `GET /api/profile/:username`.
- The public endpoint returns only published profiles, uses explicit column lists, and answers 404 identically for missing and unpublished pages. Responses are cached for 15 seconds, so an unpublish takes up to that long to disappear from caches.
- Public page route is `/:username`. Reserved names (login, register, dashboard, etc.) can't be registered, so they never collide.
- Dashboard: publish/unpublish (with confirmation), copy link, view page, and a QR code (generated in the browser with the `qrcode` package) with PNG download and the native share sheet where supported.
- The landing page now has all sections. The example phones use hardcoded sample data on purpose; all user data comes from Supabase.
- Run `npm install` again in `client/` (new dependency: `qrcode`).

## Stage 5 additions
- Analytics API: `POST /api/analytics/view` and `/click` (public, rate limited), `GET /api/analytics/overview` and `/links` (owner only). Counting uses SQL functions from migration 002, so it isn't capped by the 1000-row API limit.
- Privacy: an event stores only profile, optional link, type and timestamp. No IP address, user agent, referrer or visitor id. The owner's own visits aren't counted, and the public page sends one view per browser session.
- Daily buckets use the viewer's time zone. Charts are dependency-free SVG.
- Tests: `npm test` in `server/` (see `docs/TESTING.md`, which also has the manual and responsive checklists).
- Deployment: see `docs/DEPLOYMENT.md`. SPA rewrites are included for Vercel and Netlify.

## Security review notes
- Hardening added in Stage 5: portfolio images and link thumbnails must be files uploaded to your own Supabase Storage. Allowing any URL would let a page embed a third-party tracking pixel and reveal visitors' IP addresses.
- The API uses the service-role key, so ownership is enforced in code (every owned query filters on the signed-in user's profile id), with RLS as a second layer. Don't add a route without that filter.
- Sessions are kept in `localStorage`. React escapes all rendered text and every URL is checked as http(s), but a future XSS bug could expose tokens. The CSP in `docs/DEPLOYMENT.md` reduces that risk.
- `GET /api/auth/username-available` reveals whether a username exists. That's needed for signup and is rate limited.
- Not built because the brief didn't ask: account deletion, MFA, image moderation, and distributed rate limiting (limits are per server instance).
