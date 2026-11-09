# Testing

## Automated API tests
```
cd server
# add TEST_USER_A_* and TEST_USER_B_* (two confirmed throwaway accounts) to .env
npm run dev          # terminal 1
npm test             # terminal 2
```
Covers: no-token and forged-token rejection on every protected route, security headers, unsafe URL/theme/image input, cross-user read/edit/delete/reorder (must 404/400), duplicate usernames (case-insensitive), published-only public access with no private fields, inactive links hidden, analytics counting, and analytics isolation.

## Manual checklist
Registration and login
- [ ] Register with a new email and username. A confirmation email arrives (if confirmation is on). Log in after confirming.
- [ ] Register again with the same username (any capitalization): blocked with "That username is taken."
- [ ] Wrong password shows one generic message. Refresh the page while signed in: still signed in. Log out: dashboard redirects to login.
- [ ] Forgot password: same message for real and fake emails. Reset link opens /reset-password and the new password works.

Content
- [ ] Add, edit, hide, reorder (refresh to confirm it stuck) and delete a link. Try `javascript:alert(1)` as a URL: rejected.
- [ ] Add a social link with a mismatched domain: rejected. Add the same platform twice: rejected.
- [ ] Upload a profile photo (JPG, then a 3 MB file: rejected). Upload a text file renamed to .jpg: rejected.
- [ ] Add a project with an image. Edit and delete it.
- [ ] Change theme preset and custom options, leave without saving: not saved. Save, reload: persisted.

Publishing and sharing
- [ ] Draft: `/yourname` in a private window shows "page not found."
- [ ] Publish: page loads for a signed-out visitor. QR downloads and, when scanned with a phone, opens the page.
- [ ] Unpublish: page is gone within ~15 seconds.

Analytics
- [ ] In a private window visit the page and click a link. Dashboard counts +1 view and +1 click (give it a refresh).
- [ ] Visit your own page while signed in: not counted. Reload in the same private session: not counted twice.

## Responsive checklist
Test at 360, 390, 768, 1024 and 1440 px wide (browser dev tools device mode), in light and dark mode.
- [ ] Landing: no horizontal scrolling, hero and example phones stack cleanly, FAQ opens and closes.
- [ ] Auth pages: card fits at 360 px and the keyboard doesn't hide the submit button.
- [ ] Dashboard: below 900 px the sidebar is a slide-in menu, above it is fixed. Tap targets are at least 34 px.
- [ ] Links, social and portfolio forms fit on a phone and scroll inside the dialog.
- [ ] Appearance: below 1000 px the Customize/Preview tabs appear; above, preview sits beside the controls.
- [ ] Public page: readable at 360 px with long names, long URLs and many links; keyboard focus is visible.
- [ ] Analytics: chart stays inside its card at 360 px.
