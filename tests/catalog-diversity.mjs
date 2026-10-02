// Read-only API/UI regression for the 2026-10-02 import. No accounts or fixtures.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'database/catalog-diversity-20261002.json'), 'utf8'));
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const origin = 'http://127.0.0.1:5173';
const mapping = { DiaDiem: ['diadiem', 'destinations', 'maDiaDiem', 'tenDiaDiem'], KhachSan: ['khachsan', 'hotels', 'maKhachSan', 'tenKhachSan'], NhaHang: ['nhahang', 'restaurants', 'maNhaHang', 'tenNhaHang'], Tour: ['tour', 'tours', 'maTour', 'tenTour'] };
async function get(route) {
  const response = await fetch(origin + '/api/' + route);
  assert.equal(response.status, 200, route);
  return response.json();
}
const all = Object.fromEntries(await Promise.all(Object.entries(mapping).map(async ([kind, [route]]) => [kind, await get(route)])));
const targets = [], byKey = new Map(), imageUrls = new Set();
for (const p of manifest.places) {
  const [api, route, idKey, nameKey] = mapping[p.kind];
  const matches = all[p.kind].filter(r => r[nameKey] === p.name && r.tinhThanh === p.province);
  assert.equal(matches.length, 1, p.name);
  const item = await get(`${api}/${matches[0][idKey]}`);
  assert(item.moTa.includes(p.source)); assert(item.moTa.includes(manifest.verifiedOn));
  assert.equal(Number(item.diemDanhGia), 0, 'No synthetic ratings');
  if (p.kind === 'DiaDiem') { assert.equal(item.mienPhi, false); assert.equal(Number(item.giaVe), 0); }
  if (p.kind === 'KhachSan') { assert.equal((await get(`loaiphong/bykhachsan/${item[idKey]}`)).length, 0); assert.equal(item.loaiLuuTru, p.accommodationType); }
  if (p.kind === 'NhaHang') { assert.equal(Number(item.giaMin), 0); assert.equal(Number(item.giaMax), 0); }
  byKey.set(p.key, { kind: p.kind, id: item[idKey], name: p.name });
  targets.push({ route: `/${route}/${item[idKey]}`, name: p.name, kind: p.kind });
}
for (const tour of manifest.tours) {
  const rows = all.Tour.filter(t => t.tenTour === tour.name); assert.equal(rows.length, 1, tour.name);
  const item = rows[0]; assert.equal(item.soNgay, tour.days); assert.equal(item.soDem, tour.days - 1);
  assert.equal(Number(item.giaTour), 0); assert.equal(Number(item.diemDanhGia), 0);
  assert.match(item.moTa, /không phải sản phẩm đang mở bán/);
  assert.equal((await get('tourkhoihanh/bytour/' + item.maTour)).length, 0);
  const stops = (await get('tourchitiet/bytour/' + item.maTour)).sort((a, b) => a.ngayThu - b.ngayThu || a.thuTu - b.thuTu);
  assert.equal(stops.length, tour.stops.length);
  const order = new Map();
  for (const [index, expected] of tour.stops.entries()) {
    const actual = stops[index];
    const target = expected.key ? byKey.get(expected.key) : { kind: expected.kind, name: expected.name, id: all[expected.kind].find(row => row[mapping[expected.kind][3]] === expected.name && row.tinhThanh === expected.province)[mapping[expected.kind][2]] };
    order.set(expected.day, (order.get(expected.day) || 0) + 1);
    assert.equal(actual.ngayThu, expected.day); assert.equal(actual.thuTu, order.get(expected.day));
    assert.equal(actual.loaiDiaDiem, target.kind); assert.equal(actual[mapping[target.kind][2]], target.id);
    assert.equal(actual.tenDiaDiem, target.name); assert(!actual.thoiGianBatDau && !actual.thoiGianKetThuc);
    assert(actual.ghiChu.length > 0);
  }
  assert.equal(new Set(item.hinhAnh.map(p => p.duongDan)).size, item.hinhAnh.length, 'No repeated tour image');
  for (const image of item.hinhAnh) {
    assert(image.nguon && image.tacGia && image.giayPhep);
    assert(stops.some(stop => stop.hinhAnh.some(p => p.duongDan === image.duongDan)), 'Tour image belongs to actual stop');
    imageUrls.add(image.duongDan);
  }
  targets.push({ route: `/tours/${item.maTour}`, name: tour.name, kind: 'Tour', days: tour.days, activities: stops.length });
}
for (const url of imageUrls) { const r = await fetch(origin + url); assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /^image\//); }
assert.equal((await get('provinces')).length, 34);
const browser = await chromium.launch(), errors = [];
let visits = 0;
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
    for (const target of targets) {
      await page.goto(origin + target.route);
      await expect(page.getByRole('heading', { name: target.name, exact: true }).first()).toBeVisible();
      if (target.kind === 'Tour') {
        await expect(page.locator('.schedule-activity')).toHaveCount(target.activities);
        await expect(page.locator('.schedule-day')).toHaveCount(target.days);
        for (const link of await page.locator('.schedule-activity a.editorial-link').all()) assert.match(await link.getAttribute('href'), /^\/(destinations|hotels|restaurants)\/\d+$/);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Overflow ' + target.route);
      visits++;
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ verifiedPlaces: manifest.places.length, verifiedTours: manifest.tours.length, linkedImagesAvailable: imageUrls.size, detailPageVisits: visits, errors }, null, 2));
} finally { await browser.close(); }
