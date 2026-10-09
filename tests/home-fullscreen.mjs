// Read-only homepage checks. Requires frontend :5173 and backend :5000.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const capture = !process.argv.includes('--no-capture');
const browser = await chromium.launch();
const errors = [], results = [];
const out = path.join(root, '.impeccable/review');
if (capture) await mkdir(out, { recursive: true });
try {
  for (const [name, width, height] of [['desktop', 1440, 960], ['tablet', 820, 1180], ['mobile', 390, 844], ['compact', 320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5173');
    await page.evaluate(() => document.fonts.ready);
    const home = page.locator('.booking-home'), hero = page.locator('.booking-hero'), header = page.locator('.travel-header');
    await page.locator('.booking-hero__image').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    await expect(header).toHaveClass(/is-hero/);
    await expect(page.getByRole('button', { name: 'Tiếp tục chuyển ảnh' })).toBeVisible();
    await expect(hero.locator('.booking-hero__image.is-active')).toHaveCount(1);
    await expect(hero.locator('.booking-hero__image.is-active')).toHaveAttribute('aria-hidden', 'false');
    await expect(hero.locator('.booking-hero__image.is-active')).not.toHaveAttribute('alt', '');
    for (const image of await hero.locator('.booking-hero__image:not(.is-active)').all()) {
      await expect(image).toHaveAttribute('aria-hidden', 'true');
      await expect(image).toHaveAttribute('alt', '');
    }
    const bounds = await hero.boundingBox();
    assert.equal(bounds.x, 0); assert.equal(bounds.y, 0); assert.equal(bounds.width, width);
    assert(bounds.height >= height, `${name}: hero shorter than viewport`);
    if (name !== 'compact') assert(bounds.height <= height + 1, `${name}: hero should fit standard viewport, got ${bounds.height}`);
    assert(await home.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: horizontal overflow`);
    for (const control of await page.locator('.booking-hero__controls button').all()) {
      const b = await control.boundingBox();
      assert(b.width >= 44 && b.height >= 44, `${name}: small slide control`);
      assert(b.y + b.height <= bounds.height, `${name}: clipped slide control`);
    }
    await expect(hero.locator('.booking-hero__image')).toHaveCount(6);
    await expect(hero.locator('.booking-hero__choice')).toHaveCount(6);
    for (const [index, place] of ['Hạ Long', 'Hội An', 'Đà Nẵng', 'Tràng An', 'Mù Cang Chải', 'Eo Gió'].entries()) {
      const choice = page.getByRole('button', { name: `Xem ảnh ${index + 1}: ${place}`, exact: true });
      await expect(choice).toBeVisible();
      await expect(choice).toHaveText(String(index + 1));
    }
    await expect(page.locator('.booking-hero__controls img')).toHaveCount(0);
    await expect(page.locator('.booking-search')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Bạn muốn đi đâu?' })).toHaveCount(0);
    await expect(page.locator('.booking-destinations > a')).toHaveCount(5);
    await expect(page.locator('.booking-hero__image.is-active')).toHaveCSS('transform', 'none');
    if (capture && name !== 'compact') await page.screenshot({ path: path.join(out, `${name}-hero.png`) });
    const explore = page.getByRole('button', { name: 'Khám phá tiếp' });
    if (await explore.isVisible()) {
      await explore.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.home-story h2')).toBeFocused();
      assert(await home.evaluate(el => el.scrollTop > 0), `${name}: explore should scroll to discovery`);
      await home.evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
    }
    await home.evaluate(el => el.scrollTo({ top: 500, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-home-scrolled/);
    await expect(header).toHaveCSS('background-color', 'rgb(40, 75, 65)');
    const menuButton = page.getByRole('button', { name: 'Mở menu' });
    await menuButton.click(); await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(menuButton).toBeFocused();
    for (const [label, route] of [['Xem tour', '/tours'], ['Tìm phòng', '/hotels'], ['Xem nhà hàng', '/restaurants'], ['Lên kế hoạch chuyến đi', '/planner']]) {
      await expect(page.locator('.home-service-links a').filter({ hasText: label })).toHaveAttribute('href', route);
    }
    for (const selector of ['.home-story', '.booking-services', '.booking-featured', '.booking-cta']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.locator(selector).locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
      assert(await home.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: lower-page overflow`);
    }
    const footer = page.locator('.booking-footer');
    await footer.scrollIntoViewIfNeeded();
    for (const [label, href] of [['Điểm đến','/destinations'],['Tour du lịch','/tours'],['Nơi lưu trú','/hotels'],['Nhà hàng','/restaurants'],['Lập lịch trình','/planner'],['Đăng nhập','/login'],['Nguồn ảnh & ghi công','/image-credits']]) {
      await expect(footer.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
    }
    assert(await home.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: footer overflow`);
    if (capture && name !== 'compact') await footer.screenshot({path: path.join(out, `${name}-footer.png`)});
    await footer.getByRole('button', { name: 'Về đầu trang' }).focus();
    await page.keyboard.press('Enter');
    await expect(hero.locator('h1')).toBeFocused();
    await expect.poll(() => home.evaluate(el => el.scrollTop)).toBe(0);
    await home.evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(header).toHaveClass(/is-hero/);
    // The app scrolls a fixed-height main. Expand only for a full-document evidence capture.
    if (capture && name !== 'compact') {
      await home.evaluate(el => { el.style.height = 'auto'; el.style.overflow = 'visible'; });
      await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
      await home.evaluate(el => { el.style.removeProperty('height'); el.style.removeProperty('overflow'); });
    }
    await page.getByRole('button', { name: 'Ảnh tiếp theo' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Xem ảnh 2' })).toHaveAttribute('aria-pressed', 'true');
    await expect(hero.locator('.booking-hero__image.is-active')).toHaveAttribute('alt', 'Phố cổ Hội An');
    await expect(hero.locator('.booking-hero__image.is-active')).toHaveAttribute('aria-hidden', 'false');
    await expect(hero.locator('.booking-hero__image').first()).toHaveAttribute('aria-hidden', 'true');
    await expect(hero.locator('.booking-hero__image').first()).toHaveAttribute('alt', '');
    await page.getByRole('button', { name: 'Xem ảnh 3' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Xem ảnh 3' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Xem ảnh 1' }).click();
    await page.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
    await page.getByRole('button', { name: 'Ảnh trước' }).click();
    await expect(page.getByRole('button', { name: 'Xem ảnh 1' })).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.home-destination--2').click();
    await expect(page).toHaveURL(/\/destinations\?keyword=/);
    await expect(header).not.toHaveClass(/is-hero|is-home-scrolled/);
    await page.locator('.travel-wordmark').click(); await expect(header).toHaveClass(/is-hero/);
    results.push(`${name}: fullscreen or accessible short-screen growth, 44px controls, image semantics, keyboard carousel, explore focus, routes, scroll/header, menu keyboard focus`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  // Controlled clock tests avoid real 8-second waits and make autoplay reproducible.
  const motion = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await motion.clock.install(); await motion.goto('http://127.0.0.1:5173');
  await motion.clock.fastForward(8100);
  await expect(motion.getByRole('button', { name: 'Xem ảnh 2' })).toHaveAttribute('aria-pressed', 'true');
  await motion.locator('.booking-hero__actions a').first().focus();
  await motion.clock.fastForward(16000);
  await expect(motion.getByRole('button', { name: 'Xem ảnh 2' })).toHaveAttribute('aria-pressed', 'true');
  await motion.getByRole('button', { name: 'Tạm dừng chuyển ảnh' }).click();
  await motion.locator('.travel-wordmark').focus(); await motion.clock.fastForward(16000);
  await expect(motion.getByRole('button', { name: 'Xem ảnh 2' })).toHaveAttribute('aria-pressed', 'true');
  await motion.close();
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.clock.install(); await reduced.goto('http://127.0.0.1:5173');
  await expect(reduced.getByRole('button', { name: 'Tiếp tục chuyển ảnh' })).toBeVisible();
  await reduced.clock.fastForward(16100);
  await expect(reduced.getByRole('button', { name: 'Xem ảnh 1' })).toHaveAttribute('aria-pressed', 'true');
  await reduced.getByRole('button', { name: 'Xem ảnh 2' }).click();
  await reduced.clock.fastForward(16100);
  await expect(reduced.getByRole('button', { name: 'Xem ảnh 2' })).toHaveAttribute('aria-pressed', 'true');
  await reduced.close();
  const broken = await browser.newPage({ reducedMotion: 'reduce' });
  await broken.route('**/media/library/ha-long-83214199.jpg', route => route.abort());
  await broken.goto('http://127.0.0.1:5173');
  await expect(broken.locator('.booking-hero').getByRole('status')).toContainText('Ảnh chưa tải được');
  await broken.unroute('**/media/library/ha-long-83214199.jpg');
  await broken.getByRole('button', { name: 'Thử lại' }).click();
  await broken.locator('.booking-hero__image.is-active').evaluate(img => img.decode());
  await expect(broken.locator('.booking-hero').getByRole('status')).toHaveCount(0);
  await broken.close();
  results.push('Autoplay 8 seconds, keyboard focus/pause, reduced-motion remains paused, broken-image retry');
  const credits = await browser.newPage();
  await credits.goto('http://127.0.0.1:5173/image-credits');
  const hoiAn = credits.locator('.catalog-card').filter({ has: credits.locator('img[src="/media/vietnam/hoi-an.jpg"]') });
  await expect(hoiAn).toHaveCount(1);
  await expect(hoiAn).toContainText('John Lian');
  await expect(hoiAn).toContainText('CC BY-SA 4.0');
  await credits.close();
  results.push('Image-credit deduplication preserves author and license');
  console.log(JSON.stringify({ results, browserErrors: errors, captures: capture ? out : 'disabled' }, null, 2));
} finally { await browser.close(); }
