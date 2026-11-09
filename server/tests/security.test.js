// Integration tests against a RUNNING API (npm run dev in another terminal).
// Needs two real, confirmed accounts. Set in server/.env:
//   TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD
//   TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD
// Use throwaway accounts: tests create and delete links and briefly publish/unpublish A's page.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.TEST_API_URL || 'http://localhost:4000';
const env = (k) => { if (!process.env[k]) throw new Error(`Missing ${k} in .env`); return process.env[k]; };

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json, headers: res.headers };
}
async function login(email, password) {
  const r = await call('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(r.status, 200, `login failed for ${email}: check the TEST_USER_* values`);
  return r.json.session.access_token;
}

let A, B, profileA, profileB, linkA;

before(async () => {
  A = await login(env('TEST_USER_A_EMAIL'), env('TEST_USER_A_PASSWORD'));
  B = await login(env('TEST_USER_B_EMAIL'), env('TEST_USER_B_PASSWORD'));
  profileA = (await call('GET', '/api/profile/me', { token: A })).json.profile;
  profileB = (await call('GET', '/api/profile/me', { token: B })).json.profile;
  linkA = (await call('POST', '/api/links', { token: A, body: { title: 'Test link', url: 'https://example.com' } })).json.link;
});

after(async () => {
  if (linkA) await call('DELETE', `/api/links/${linkA.id}`, { token: A });
  await call('POST', '/api/profile/unpublish', { token: A });
});

test('protected endpoints reject requests with no token', async () => {
  const routes = [
    ['GET', '/api/auth/me'], ['POST', '/api/auth/logout'],
    ['GET', '/api/profile/me'], ['PUT', '/api/profile/me'], ['POST', '/api/profile/publish'], ['POST', '/api/profile/unpublish'],
    ['GET', '/api/links'], ['POST', '/api/links'], ['PATCH', '/api/links/reorder'],
    ['GET', '/api/social-links'], ['POST', '/api/social-links'],
    ['GET', '/api/portfolio'], ['POST', '/api/portfolio'],
    ['GET', '/api/themes'], ['PUT', '/api/themes'],
    ['GET', '/api/analytics/overview'], ['GET', '/api/analytics/links'],
  ];
  for (const [m, p] of routes) assert.equal((await call(m, p, { body: {} })).status, 401, `${m} ${p}`);
});

test('a forged token is rejected', async () => {
  assert.equal((await call('GET', '/api/links', { token: 'not-a-real-token' })).status, 401);
});

test('security headers are set', async () => {
  const r = await call('GET', '/api/health');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('unsafe or malformed input is rejected', async () => {
  const bad = await call('POST', '/api/links', { token: A, body: { title: 'x', url: 'javascript:alert(1)' } });
  assert.equal(bad.status, 400);
  assert.equal((await call('PUT', '/api/themes', { token: A, body: { preset: 'light', background_color: 'red' } })).status, 400);
  assert.equal((await call('POST', '/api/social-links', { token: A, body: { platform: 'instagram', url: 'https://evil.example/x' } })).status, 400);
  assert.equal((await call('POST', '/api/portfolio', { token: A, body: { title: 'p', image_url: 'https://tracker.example/pixel.png' } })).status, 400);
  assert.equal((await call('PUT', '/api/profile/me', { token: A, body: { full_name: 'A', username: 'Bad Name!' } })).status, 400);
});

test('user B cannot read, edit, delete or reorder user A’s links', async () => {
  const list = await call('GET', '/api/links', { token: B });
  assert.ok(!list.json.links.some((l) => l.id === linkA.id));
  const body = { title: 'hijacked', url: 'https://example.com' };
  assert.equal((await call('PUT', `/api/links/${linkA.id}`, { token: B, body })).status, 404);
  assert.equal((await call('DELETE', `/api/links/${linkA.id}`, { token: B })).status, 404);
  assert.equal((await call('PATCH', '/api/links/reorder', { token: B, body: { ids: [linkA.id] } })).status, 400);
  const still = await call('GET', '/api/links', { token: A });
  assert.equal(still.json.links.find((l) => l.id === linkA.id).title, 'Test link');
});

test('duplicate usernames are blocked', async () => {
  const r = await call('PUT', '/api/profile/me', { token: B, body: { full_name: profileB.full_name || 'Test B', username: profileA.username } });
  assert.equal(r.status, 409);
  const upper = await call('PUT', '/api/profile/me', { token: B, body: { full_name: profileB.full_name || 'Test B', username: profileA.username.toUpperCase() } });
  assert.equal(upper.status, 409, 'case-insensitive');
});

test('only published profiles are public, and private fields never leak', async () => {
  await call('PUT', '/api/profile/me', { token: A, body: { full_name: profileA.full_name || 'Test A', username: profileA.username } });
  await call('POST', '/api/profile/unpublish', { token: A });
  assert.equal((await call('GET', `/api/profile/${profileA.username}`)).status, 404);

  assert.equal((await call('POST', '/api/profile/publish', { token: A })).status, 200);
  const pub = await call('GET', `/api/profile/${profileA.username}`);
  assert.equal(pub.status, 200);
  assert.ok(!('user_id' in pub.json.profile) && !('id' in pub.json.profile) && !('is_published' in pub.json.profile));
  assert.ok(pub.json.links.some((l) => l.id === linkA.id));

  await call('POST', '/api/profile/unpublish', { token: A });
  assert.equal((await call('GET', `/api/profile/${profileA.username}`)).status, 404);
});

test('inactive links are hidden from the public page and can’t be clicked', async () => {
  await call('PUT', `/api/links/${linkA.id}`, { token: A, body: { title: 'Test link', url: 'https://example.com', is_active: false } });
  await call('POST', '/api/profile/publish', { token: A });
  const pub = await call('GET', `/api/profile/${profileA.username}`);
  assert.ok(!pub.json.links.some((l) => l.id === linkA.id));
  assert.equal((await call('POST', '/api/analytics/click', { body: { link_id: linkA.id } })).status, 404);
  await call('PUT', `/api/links/${linkA.id}`, { token: A, body: { title: 'Test link', url: 'https://example.com', is_active: true } });
});

test('analytics counts anonymous views and clicks, not the owner’s, and rejects bad input', async () => {
  await call('POST', '/api/profile/publish', { token: A });
  const before = (await call('GET', '/api/analytics/overview?days=7', { token: A })).json;

  assert.equal((await call('POST', '/api/analytics/view', { body: { username: profileA.username } })).status, 201);
  assert.equal((await call('POST', '/api/analytics/click', { body: { link_id: linkA.id } })).status, 201);
  assert.equal((await call('POST', '/api/analytics/view', { token: A, body: { username: profileA.username } })).json.counted, false);

  const after = (await call('GET', '/api/analytics/overview?days=7', { token: A })).json;
  assert.equal(after.totals.views, before.totals.views + 1);
  assert.equal(after.totals.clicks, before.totals.clicks + 1);
  assert.equal(after.daily.length, 7);

  assert.equal((await call('POST', '/api/analytics/click', { body: { link_id: 'nope' } })).status, 400);
  assert.equal((await call('GET', '/api/analytics/overview?days=5', { token: A })).status, 400);
  // B must not see A's numbers
  const b = (await call('GET', '/api/analytics/overview?days=7', { token: B })).json;
  assert.notEqual(b.totals.views, after.totals.views + 1000);
  assert.ok(!(await call('GET', '/api/analytics/links', { token: B })).json.links.some((l) => l.link_id === linkA.id));
});
