// GET-only checks for the six-slide homepage and route-specific header.
// Requires local frontend/backend. No logins, screenshots, or database mutations.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const origin = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const forest = 'rgb(40, 75, 65)';
const slides = [
  { name: 'Hạ Long', alt: 'Vịnh Hạ Long', id: 1, image: '/media/library/ha-long-83214199.jpg' },
  { name: 'Hội An', alt: 'Phố cổ Hội An', id: 4, image: '/media/vietnam/hoi-an.jpg' },
  { name: 'Đà Nẵng', alt: 'Cầu Vàng, Đà Nẵng', id: 3, image: '/media/vietnam/cau-vang.jpg' },
  { name: 'Tràng An', alt: 'Tràng An, Ninh Bình', id: 30, image: '/media/library/ninh-binh-145501694.jpg' },
  { name: 'Mù Cang Chải', alt: 'Ruộng bậc thang Chế Cu Nha, Mù Cang Chải', id: 127, image: '/media/coverage-20261002/destination-127-61895716.jpg' },
  { name: 'Eo Gió', alt: 'Eo Gió, Nhơn Lý', id: 124, image: '/media/coverage-20261002/destination-124-128670721.jpg' },
];
const addedCredits = [
  { image: slides[3].image, author: 'Jakub Hałun', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1433_5283.jpg', licenseUrl: 'https://creativecommons.org/licenses/by/4.0' },
  { image: slides[4].image, author: 'Doan Tuan danny_pham93', license: 'CC0', source: 'https://commons.wikimedia.org/wiki/File:Terraces_in_Che_Cu_Nha_commune,_Mu_Cang_Chai_(Unsplash).jpg', licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en' },
  { image: slides[5].image, author: 'Hưng Hồ Bá', license: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Eo_Gi%C3%B3_-_Nh%C6%A1n_L%C3%BD.jpg', licenseUrl: 'https://creativecommons.org/licenses/by/2.0' },
];
const browser = await chromium.launch();
const errors = [], writes = [], results = [];

async function prepare(page, route = '/') {
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', requestRoute => {
    const request = requestRoute.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
      return requestRoute.abort();
    }
    return requestRoute.continue();
  });
  await page.goto(`${origin}${route}`);
  await page.evaluate(() => document.fonts.ready);
}

async function transparentHeader(page) {
  const header = page.locator('.travel-header');
  await expect(header).toHaveClass(/is-hero/);
  await expect(header).not.toHaveClass(/is-home-scrolled/);
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(header).toHaveCSS('background-image', 'none');
  await expect(header).toHaveCSS('backdrop-filter', 'none');
}

async function activeSlide(page, index) {
  const images = page.locator('.booking-hero__image');
  const choices = page.locator('.booking-hero__choice');
  await expect(page.locator('.booking-hero__image.is-active')).toHaveCount(1);
  await expect(page.locator('.booking-hero__choice[aria-pressed="true"]')).toHaveCount(1);
  for (let i = 0; i < 6; i++) {
    await expect(choices.nth(i)).toHaveAttribute('aria-pressed', String(i === index));
    await expect(images.nth(i)).toHaveAttribute('aria-hidden', String(i !== index));
    if (i === index) await expect(images.nth(i)).toHaveAttribute('alt', slides[i].alt);
    else await expect(images.nth(i)).toHaveAttribute('alt', '');
  }
}

async function controlsFit(page, name, width) {
  const hero = await page.locator('.booking-hero').boundingBox();
  const boxes = await page.locator('.booking-hero__controls button').evaluateAll(buttons => buttons.map(button => {
    const box = button.getBoundingClientRect();
    return { label: button.getAttribute('aria-label'), x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  assert.equal(boxes.length, 9, `${name}: six choices and previous/next/pause controls`);
  for (const box of boxes) {
    assert(box.width >= 44 && box.height >= 44, `${name}: ${box.label} has a 44px hit area`);
    assert(box.x >= -1 && box.x + box.width <= width + 1, `${name}: ${box.label} fits horizontally`);
    assert(box.y >= hero.y && box.y + box.height <= hero.y + hero.height + 1, `${name}: ${box.label} fits inside hero`);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      assert(overlapX <= 1 || overlapY <= 1, `${name}: ${a.label} and ${b.label} do not overlap`);
    }
  }
  if (width <= 760) {
    const choices = boxes.filter(box => box.label.startsWith('Xem ảnh '));
    const navigation = boxes.filter(box => !box.label.startsWith('Xem ảnh '));
    assert(Math.max(...choices.map(box => box.y)) - Math.min(...choices.map(box => box.y)) <= 1,
      `${name}: all six numbers occupy one row`);
    assert(Math.min(...navigation.map(box => box.y)) >= Math.max(...choices.map(box => box.y + box.height)) - 1,
      `${name}: previous/next/pause occupy the row below numbers`);
  }
}

try {
  for (const [name, width, height] of [
    ['wide', 1898, 960], ['desktop', 1440, 960], ['tablet', 820, 1180],
    ['mobile', 390, 844], ['compact', 320, 568], ['low-landscape', 820, 390],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    await prepare(page);
    const main = page.locator('.booking-home');
    const hero = page.locator('.booking-hero');
    const images = page.locator('.booking-hero__image');
    const choices = page.locator('.booking-hero__choice');
    await expect(images).toHaveCount(6);
    await expect(choices).toHaveCount(6);
    await images.evaluateAll(all => Promise.all(all.map(image => image.decode())));
    const imagePaths = await images.evaluateAll(all => all.map(image => new URL(image.src).pathname));
    assert.equal(new Set(imagePaths).size, 6, `${name}: six different loaded photographs`);
    assert.deepEqual(imagePaths, slides.map(slide => slide.image), `${name}: established first three photographs precede the three additions`);
    await expect(hero.locator('.booking-hero__controls img')).toHaveCount(0);
    await expect(page.locator('.booking-search')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Bạn muốn đi đâu?' })).toHaveCount(0);
    assert(await hero.evaluate(element => element.nextElementSibling?.classList.contains('home-story')),
      `${name}: story directly follows hero`);
    await transparentHeader(page);
    await activeSlide(page, 0);
    await controlsFit(page, name, width);
    const bounds = await hero.boundingBox();
    assert(bounds.x === 0 && bounds.y === 0 && bounds.width === width && bounds.height >= height,
      `${name}: full-width hero fills viewport or grows on a short screen`);
    assert(await main.evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${name}: no horizontal overflow`);

    const destinationLinks = [];
    for (let i = 0; i < 6; i++) {
      await expect(choices.nth(i)).toHaveText(String(i + 1));
      await expect(choices.nth(i)).toHaveAttribute('aria-label', `Xem ảnh ${i + 1}: ${slides[i].name}`);
      await choices.nth(i).focus();
      await page.keyboard.press('Enter');
      await activeSlide(page, i);
      await expect(hero.locator('h1')).not.toHaveText('');
      await expect(hero.locator('.booking-hero__copy')).not.toHaveText('');
      const link = hero.locator('.booking-hero__note a').first();
      const href = await link.getAttribute('href');
      assert.equal(href, `/destinations/${slides[i].id}`, `${name}: slide ${i + 1} links to its verified destination`);
      destinationLinks.push(href);
      await expect(link).toContainText(await images.nth(i).getAttribute('alt'));
    }
    assert.equal(new Set(destinationLinks).size, 6, `${name}: each slide links to a different destination`);
    await page.getByRole('button', { name: 'Ảnh tiếp theo', exact: true }).click();
    await activeSlide(page, 0);
    await page.getByRole('button', { name: 'Ảnh trước', exact: true }).click();
    await activeSlide(page, 5);
    await main.evaluate(element => element.scrollTo({ top: 0, behavior: 'instant' }));
    await transparentHeader(page);
    await main.evaluate(element => element.scrollTo({ top: 40, behavior: 'instant' }));
    await transparentHeader(page);
    await main.evaluate(element => element.scrollTo({ top: 41, behavior: 'instant' }));
    await expect(page.locator('.travel-header')).toHaveClass(/is-home-scrolled/);
    await main.evaluate(element => element.scrollTo({ top: 500, behavior: 'instant' }));
    await expect(page.locator('.travel-header')).toHaveClass(/is-home-scrolled/);
    await expect(page.locator('.travel-header')).toHaveCSS('background-color', forest);
    await main.evaluate(element => element.scrollTo({ top: 0, behavior: 'instant' }));
    await transparentHeader(page);

    const explore = page.getByRole('button', { name: 'Khám phá tiếp', exact: true });
    if (width > 1100) await expect(explore).toBeVisible();
    if (await explore.isVisible()) {
      await explore.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.home-story h2')).toBeFocused();
      const headingFocus = await page.locator('.home-story h2').evaluate(element => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      assert(headingFocus.style !== 'none' && headingFocus.width >= 2, `${name}: focused story heading has a visible keyboard outline`);
      assert(await main.evaluate(element => element.scrollTop > 0), `${name}: exploration scrolls to the story`);
      const storyHeading = await page.locator('.home-story h2').boundingBox();
      const headerBox = await page.locator('.travel-header').boundingBox();
      assert(storyHeading.y >= headerBox.y + headerBox.height - 1, `${name}: focused story heading clears header`);
    }
    const menu = page.getByRole('button', { name: 'Mở menu', exact: true });
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'Menu điều hướng' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await page.locator('.booking-footer').getByRole('button', { name: 'Về đầu trang' }).click();
    await expect(hero.locator('h1')).toBeFocused();
    await expect.poll(() => main.evaluate(element => element.scrollTop)).toBe(0);
    await transparentHeader(page);
    results.push(`${name} ${width}x${height}: six loaded numeric slides, active-image semantics, wraparound, 44px controls, removed strip, header scroll/return, story focus and menu Escape`);
    await page.close();
  }

  const routes = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  await prepare(routes);
  for (const route of ['/destinations', '/tours', '/hotels', '/restaurants', '/image-credits', '/login', '/register']) {
    await routes.goto(`${origin}${route}`);
    const header = routes.locator('.travel-header');
    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/is-hero|is-home-scrolled/);
    await expect(header).toHaveCSS('background-color', forest);
    await routes.evaluate(() => {
      const main = document.querySelector('.user-page');
      if (main) main.scrollTo({ top: 500, behavior: 'instant' });
      window.scrollTo({ top: 500, behavior: 'instant' });
    });
    await expect(header).toHaveCSS('background-color', forest);
    await routes.locator('.travel-wordmark').click();
    await transparentHeader(routes);
  }
  await routes.goto(`${origin}/admin`);
  await expect(routes).toHaveURL(/\/login\?returnTo=%2Fadmin$/);
  await expect(routes.locator('.travel-header')).toHaveCSS('background-color', forest);
  await routes.close();
  results.push('Seven catalog/credits/auth routes retain green headers; return home restores transparency; anonymous admin access retains login redirect');

  const motion = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await motion.clock.install();
  await prepare(motion);
  await expect(motion.locator('.booking-hero__image').first()).toHaveCSS('transition-duration', '1.4s');
  await expect(motion.locator('.booking-hero__image').first()).toHaveCSS('transition-property', 'opacity');
  await motion.clock.fastForward(7900);
  await activeSlide(motion, 0);
  await motion.clock.fastForward(200);
  await activeSlide(motion, 1);
  await motion.locator('.booking-hero__actions a').first().focus();
  await motion.clock.fastForward(16000);
  await activeSlide(motion, 1);
  await motion.getByRole('button', { name: 'Tạm dừng chuyển ảnh', exact: true }).click();
  await motion.locator('.travel-wordmark').focus();
  await motion.clock.fastForward(16000);
  await activeSlide(motion, 1);
  await motion.getByRole('button', { name: 'Tiếp tục chuyển ảnh', exact: true }).click();
  await motion.locator('.travel-wordmark').focus();
  for (const index of [2, 3, 4, 5, 0]) {
    await motion.clock.fastForward(8100);
    await activeSlide(motion, index);
  }
  await motion.close();
  results.push('Eight-second autoplay reaches every new slide and wraps; 1.4-second opacity fade, focus pause, manual pause and resume preserved');

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.clock.install();
  await prepare(reduced);
  await expect(reduced.getByRole('button', { name: 'Tiếp tục chuyển ảnh', exact: true })).toBeVisible();
  await expect(reduced.locator('.booking-hero__image').first()).toHaveCSS('transition-duration', '0s');
  await reduced.clock.fastForward(16100);
  await activeSlide(reduced, 0);
  await reduced.locator('.booking-hero__choice').last().click();
  await reduced.clock.fastForward(16100);
  await activeSlide(reduced, 5);
  const lastPath = await reduced.locator('.booking-hero__image').last().getAttribute('src');
  await reduced.close();
  results.push('Reduced motion starts paused, disables fade and keeps a manually selected new slide fixed');

  const broken = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await broken.route(`**${lastPath}`, route => route.abort());
  await prepare(broken);
  await broken.locator('.booking-hero__choice').last().click();
  await expect(broken.locator('.booking-hero').getByRole('status')).toContainText('Ảnh chưa tải được');
  await expect(broken.locator('.booking-hero__choice')).toHaveCount(6);
  await expect(broken.locator('.booking-hero__note a').first()).toHaveAttribute('href', '/destinations/124');
  await broken.unroute(`**${lastPath}`);
  await broken.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await broken.locator('.booking-hero__image.is-active').evaluate(image => image.decode());
  await expect(broken.locator('.booking-hero').getByRole('status')).toHaveCount(0);
  await activeSlide(broken, 5);
  await broken.close();
  results.push('A failed added hero photograph keeps its controls and destination link, then retries successfully');

  const credits = await browser.newPage({ reducedMotion: 'reduce' });
  await prepare(credits, '/image-credits');
  for (const credit of addedCredits) {
    const card = credits.locator('.catalog-card').filter({ has: credits.locator(`img[src="${credit.image}"]`) });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(credit.author);
    await expect(card).toContainText(credit.license);
    await expect(card.getByRole('link', { name: 'Nguồn ảnh', exact: true })).toHaveAttribute('href', credit.source);
    // The incumbent shared credit renderer uses the source for HTTP-only license metadata.
    const licenseHref = credit.licenseUrl.startsWith('https://') ? credit.licenseUrl : credit.source;
    await expect(card.getByRole('link', { name: credit.license, exact: true })).toHaveAttribute('href', licenseHref);
    await card.scrollIntoViewIfNeeded();
    await expect.poll(() => card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  }
  await credits.close();
  results.push('All three added photographs retain one loaded credit each with exact authors/source/license labels; existing CC0 HTTP-license source fallback retained');

  assert.deepEqual(errors, [], 'No JavaScript page errors');
  assert.deepEqual(writes, [], 'No API mutations attempted');
  console.log(JSON.stringify({ results, browserErrors: errors, apiMutations: writes, captures: 'disabled' }, null, 2));
} finally {
  await browser.close();
}
