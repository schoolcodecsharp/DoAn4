// GET-only checks for the photograph-led homepage service and closing sections.
// Requires the local frontend/backend; no screenshots or database mutations.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const origin = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const errors = [], writes = [], results = [];

async function prepare(page) {
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
}

async function loadedImages(section, count) {
  const images = section.locator('img');
  await expect(images).toHaveCount(count);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).not.toHaveAttribute('alt', '');
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('decoding', 'async');
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const box = await image.boundingBox();
    assert(box && box.width > 0 && box.height > 0, 'Photograph must occupy visible space');
  }
}

async function keyboardFocus(link, name) {
  await link.focus();
  await expect(link).toBeFocused();
  const focus = await link.evaluate(el => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), shadow: style.boxShadow };
  });
  assert((focus.style !== 'none' && focus.width >= 2) || focus.shadow !== 'none', `${name}: visible keyboard focus`);
}

try {
  for (const [name, width, height] of [
    ['wide', 1853, 960], ['desktop', 1440, 960], ['tablet', 820, 1180],
    ['mobile', 390, 844], ['compact', 320, 568],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    await prepare(page);
    const main = page.locator('.booking-home');
    const services = page.locator('.booking-services');
    const cards = services.locator('.home-service-links > a');
    const cta = page.locator('.booking-cta');
    await expect(cards).toHaveCount(4);
    await loadedImages(services, 4);
    await loadedImages(cta, 1);
    await page.keyboard.press('Tab');
    for (const [index, route] of ['/tours', '/hotels', '/restaurants', '/planner'].entries()) {
      const link = cards.nth(index);
      await expect(link).toHaveAttribute('href', route);
      await expect(link.locator('h3')).not.toHaveText('');
      await expect(link.locator('p')).not.toHaveText('');
      const box = await link.boundingBox();
      assert(box && box.width >= 44 && box.height >= 44, `${name}: service link hit area`);
      await keyboardFocus(link, `${name}: ${route}`);
    }
    const action = cta.getByRole('link', { name: /Khám phá tour/ });
    await expect(action).toHaveAttribute('href', '/tours');
    await action.scrollIntoViewIfNeeded();
    const actionBox = await action.boundingBox();
    assert(actionBox && actionBox.width >= 44 && actionBox.height >= 44, `${name}: closing CTA hit area`);
    await keyboardFocus(action, `${name}: closing CTA`);
    for (const section of [services, cta]) {
      const box = await section.boundingBox();
      assert(box && box.x >= -1 && box.x + box.width <= width + 1, `${name}: section exceeds viewport`);
      assert(await section.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: section content overflow`);
    }
    assert(await main.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: homepage horizontal overflow`);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tours(?:\?|$)/);
    results.push(`${name} ${width}px: five loaded descriptive lazy photos, four service routes, closing CTA, touch/focus and horizontal fit`);
    await page.close();
  }

  const normal = await browser.newPage({ reducedMotion: 'reduce' });
  await prepare(normal);
  const servicePaths = await normal.locator('.booking-services img').evaluateAll(images => images.map(img => new URL(img.src).pathname));
  const ctaPaths = await normal.locator('.booking-cta img').evaluateAll(images => images.map(img => new URL(img.src).pathname));
  await normal.close();

  const broken = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const blocked = new Set([...servicePaths, ...ctaPaths]);
  await broken.route('**/media/**', route => blocked.has(new URL(route.request().url()).pathname) ? route.abort() : route.continue());
  await prepare(broken);
  for (const selector of ['.booking-services', '.booking-cta']) {
    const section = broken.locator(selector);
    await section.scrollIntoViewIfNeeded();
    if (selector === '.booking-services') {
      for (const card of await section.locator('.home-service-links > a').all()) {
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator('img')).toHaveCount(0);
        await expect(card).toContainText(/Ảnh .*đang được cập nhật/);
      }
    }
    await expect(section.locator('img')).toHaveCount(0);
    await expect(section).toContainText(/Ảnh .*đang được cập nhật/);
    assert(await section.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Image fallback must fit mobile viewport');
  }
  await expect(broken.locator('.booking-services .home-service-links > a')).toHaveCount(4);
  await expect(broken.locator('.booking-cta').getByRole('link', { name: /Khám phá tour/ })).toBeVisible();
  await broken.close();
  results.push('Blocked service/banner photos: readable fallback, retained links and mobile fit');

  const credits = await browser.newPage({ reducedMotion: 'reduce' });
  await prepare(credits);
  await credits.goto(`${origin}/image-credits`);
  const foodCredit = credits.locator('.catalog-card').filter({ has: credits.locator('img[src="/media/home-editorial-20261008/bun-cha-hanoi.jpg"]') });
  await expect(foodCredit).toHaveCount(1);
  await expect(foodCredit).toContainText('Bún chả Hà Nội');
  await expect(foodCredit).toContainText('Weetjesman');
  await expect(foodCredit).toContainText('CC BY-SA 4.0');
  await expect(foodCredit.locator('a[href="https://commons.wikimedia.org/wiki/File:Bun_cha_Hanoi.jpg"]')).toHaveCount(1);
  await expect(foodCredit.locator('a[href="https://creativecommons.org/licenses/by-sa/4.0/"]')).toHaveCount(1);
  await foodCredit.scrollIntoViewIfNeeded();
  await expect.poll(() => foodCredit.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await credits.close();
  results.push('Editorial food credit: loaded Bún chả photo, correct author, CC BY-SA 4.0 and source/license links');

  assert.deepEqual(errors, [], 'No JavaScript page errors');
  assert.deepEqual(writes, [], 'No API mutations attempted');
  console.log(JSON.stringify({ results, browserErrors: errors, apiMutations: writes, captures: 'disabled' }, null, 2));
} finally {
  await browser.close();
}
