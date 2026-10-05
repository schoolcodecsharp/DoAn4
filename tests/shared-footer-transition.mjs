// Existing SQL accounts + GET/estimate only; all real browser writes are blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, request, expect } = require('@playwright/test');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const client = await request.newContext({ baseURL });
const accounts = JSON.parse(fs.readFileSync(path.join(root, '.local/test-accounts.json'), 'utf8'));
const sessions = {}, checks = [], errors = [];
for (const role of ['admin', 'user']) {
  const r = await client.post('/api/auth/login', { data: { email: accounts[role].email, matKhau: accounts[role].password } });
  assert.equal(r.status(), 200); sessions[role] = await r.json();
}
async function get(url) { const r = await client.get('/api/' + url); assert.equal(r.status(), 200, url); return r.json(); }
const tour = (await get('tour'))[0], hotel = (await get('khachsan'))[0], destination = (await get('diadiem'))[0], restaurant = (await get('nhahang'))[0];
const room = (await get('loaiphong'))[0];
const publicRoutes = ['/', '/destinations', '/tours', '/hotels', '/restaurants', `/destinations/${destination.maDiaDiem}`, `/tours/${tour.maTour}`, `/hotels/${hotel.maKhachSan}`, `/restaurants/${restaurant.maNhaHang}`, `/hotels/${room.maKhachSan}/rooms/${room.maLoaiPhong}`, '/image-credits', '/login', '/register'];
const browser = await chromium.launch();
const output = path.join(root, '.impeccable/review/shared-footer'); fs.mkdirSync(output, { recursive: true });
async function context(width, role, reducedMotion = 'reduce') {
  const ctx = await browser.newContext({ baseURL, viewport: { width, height: 960 }, reducedMotion });
  if (role) await ctx.addInitScript(s => localStorage.setItem('tripmate_auth', JSON.stringify(s)), sessions[role]);
  await ctx.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) || new URL(route.request().url()).pathname.endsWith('/itineraries/estimate') ? route.continue() : route.fulfill({ status: 503, json: { message: 'Test safety: mutation blocked' } }));
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  return { ctx, page };
}
async function checkFooter(page, url, width, loggedIn, behindForm = false) {
  await page.goto(url);
  const footer = page.locator('.booking-footer'); await expect(footer).toHaveCount(1);
  await expect(footer).toHaveCSS('background-color', 'rgb(40, 75, 65)');
  await expect(footer.locator('.booking-footer__identity p')).toHaveCSS('font-size', '20px');
  await expect(footer.locator('.booking-footer__identity p')).toHaveCSS('color', 'rgb(255, 254, 248)');
  assert.equal(await page.locator('.user-footer').count(), 0, 'No duplicate legacy footer');
  if (loggedIn) await expect(footer.locator('a[href="/account"]')).toHaveCount(1);
  else await expect(footer.locator('a[href="/login"]')).toHaveCount(1);
  for (const href of ['/destinations', '/tours', '/hotels', '/restaurants', '/planner', '/image-credits']) await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  assert(await footer.evaluate(el => el.scrollWidth <= el.clientWidth + 2), 'Footer has no horizontal overflow');
  if (!behindForm) {
    await footer.scrollIntoViewIfNeeded();
    assert(await footer.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; }), 'Footer fits viewport');
    assert(await footer.locator('a,button').evaluateAll(items => items.every(el => el.getBoundingClientRect().height >= 44)), 'Links have 44px touch targets');
    if (['/', '/destinations', '/hotels', '/login'].includes(url)) await footer.screenshot({ path: path.join(output, `${url === '/' ? 'home' : url.slice(1)}-${width}.png`) });
    await footer.getByRole('button', { name: 'Về đầu trang', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (document.querySelector('.user-page, .booking-home')?.scrollTop || 0) + window.scrollY)).toBe(0);
    const heading = page.locator('main h1').first(); if (await heading.count()) await expect(heading).toBeFocused();
  } else await expect(page.locator('dialog[open]')).toHaveCount(1);
  checks.push(`${url}: single shared footer, links, ${behindForm ? 'preserved form overlay' : 'layout/back-to-top'} — ${width}px`);
}
try {
  for (const width of [1440, 390, 320]) {
    const guest = await context(width);
    for (const url of publicRoutes) await checkFooter(guest.page, url, width, false);
    await expect(guest.page.locator('.route-curtain')).toBeHidden();
    await guest.ctx.close();
    const customer = await context(width, 'user');
    for (const url of ['/account', '/account?tab=trips', '/account/trips/999999', '/planner?edit=999999']) await checkFooter(customer.page, url, width, true);
    for (const url of ['/planner', `/tours/${tour.maTour}/book`, `/hotels/${hotel.maKhachSan}/book`]) await checkFooter(customer.page, url, width, true, true);
    await customer.ctx.close();
  }
  const motion = await context(1440, undefined, 'no-preference');
  await motion.page.goto('/destinations');
  await expect(motion.page.locator('.route-curtain')).toHaveCSS('animation-duration', '1.6s');
  await motion.page.evaluate(() => { window.__curtain = document.querySelector('.route-curtain'); });
  await motion.page.getByRole('textbox', { name: 'Bạn muốn đến đâu?', exact: true }).fill('Hạ Long');
  await motion.page.locator('.catalog-search').getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(motion.page).toHaveURL(/keyword=/);
  assert(await motion.page.evaluate(() => window.__curtain === document.querySelector('.route-curtain')), 'Query filter does not restart transition');
  await motion.page.locator('.booking-footer a[href="/tours"]').click();
  await expect(motion.page).toHaveURL(new URL('/tours', baseURL).href);
  await expect.poll(() => motion.page.evaluate(() => window.__curtain !== document.querySelector('.route-curtain')), { message: 'New pathname restarts branded transition' }).toBe(true);
  await motion.page.evaluate(() => { const animation = document.getAnimations().find(a => a.effect?.target?.classList?.contains('route-curtain')); if (animation) { animation.pause(); animation.currentTime = 250; } });
  await motion.page.screenshot({ path: path.join(output, 'transition-brand.png') });
  await motion.page.evaluate(async () => { const animation = document.getAnimations().find(a => a.effect?.target?.classList?.contains('route-curtain')); if (animation) { animation.play(); await animation.finished; } });
  assert(await motion.page.locator('.route-curtain').evaluate(el => el.getBoundingClientRect().bottom <= 0), 'Curtain fully clears after animation');
  await motion.page.goBack(); await expect(motion.page.locator('.booking-footer')).toHaveCount(1);
  await motion.page.goForward(); await expect(motion.page.locator('.booking-footer')).toHaveCount(1);
  checks.push('1.6s branded transition, query no-replay, pathname restart, completion and Back/Forward');
  await motion.ctx.close();
  const admin = await context(390, 'admin', 'no-preference'); await admin.page.goto('/admin');
  await expect(admin.page.locator('.admin-shell')).toBeVisible();
  await expect(admin.page.locator('.booking-footer, .route-curtain')).toHaveCount(0);
  checks.push('Admin has no public footer/curtain'); await admin.ctx.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: checks.length, pageErrors: errors, checks }, null, 2));
} finally { await browser.close(); await client.dispose(); }
