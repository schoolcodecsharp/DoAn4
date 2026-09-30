// No database writes; invalid requests only. Run AFTER other suites (temporarily exhausts local buckets).
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://localhost:5000/api/';
const accounts = JSON.parse(fs.readFileSync(new URL('../.local/test-accounts.json', import.meta.url), 'utf8'));
const post = (path, data, token) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data) });
const login = await post('auth/login', { email: accounts.user.email, matKhau: accounts.user.password });
assert.equal(login.status, 200);
const session = await login.json();
const destinations = await (await fetch(base + 'diadiem')).json();
let limited;
for (let i = 0; i < 21; i++) {
  const response = await post(`feedback/destinations/${destinations[0].maDiaDiem}/comments`, { content: '' }, session.token);
  assert([400, 429].includes(response.status), await response.text());
  if (response.status === 429) { limited = response; break; }
}
assert(limited); assert(Number(limited.headers.get('retry-after')) > 0);
assert.equal((await fetch(base + `feedback/destinations/${destinations[0].maDiaDiem}`)).status, 200);
console.log('PASS: feedback writes throttled with Retry-After; public reading still available');
limited = null;
for (let i = 0; i < 11; i++) {
  const response = await post('auth/login', { email: '', matKhau: '' });
  assert([400, 429].includes(response.status), await response.text());
  if (response.status === 429) { limited = response; break; }
}
assert(limited); assert(Number(limited.headers.get('retry-after')) > 0);
console.log('PASS: login throttled; existing users/passwords/data unchanged');
