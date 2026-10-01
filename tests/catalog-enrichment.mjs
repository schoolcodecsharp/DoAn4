// Read-only catalog/media verification; never creates accounts, orders or fixtures.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium } = require('@playwright/test');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, ''));
const manifest = read('database/catalog-enrichment-20261001.json');
const photos = read('backend/Data/catalog-photos-20261001.json');
const origin = 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const errors = [], visited = [];
fs.mkdirSync(path.join(root, '.local/catalog-enrichment'), { recursive: true });
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function get(url) {
  const r = await fetch(origin + '/api/' + url);
  assert.equal(r.status, 200, url);
  return r.json();
}
try {
  for (const p of photos) {
    const file = `${p.key}-${p.id}.jpg`;
    const bytes = fs.readFileSync(path.join(root, 'backend/wwwroot/media/catalog-20261001', file));
    const meta = read('backend/Data/photo-sources/' + file + '.source.json');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), meta.Sha256, file);
    assert.equal(meta.Title, p.title); assert.equal(meta.Nguon, p.source);
    assert.equal(meta.TacGia, p.author); assert.equal(meta.GiayPhep, p.license);
    assert.equal(meta.UrlGiayPhep, p.licenseUrl);
    const r = await fetch(origin + meta.DuongDan);
    assert.equal(r.status, 200, file); assert.match(r.headers.get('content-type'), /^image\/jpeg/);
    assert.equal(crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'), meta.Sha256);
  }
  // Contact sheets are local review artifacts, never published or committed.
  const sheet = await browser.newPage({ viewport: { width: 1300, height: 1180 } });
  for (let offset = 0; offset < photos.length; offset += 10) {
    await sheet.setContent(`<style>body{margin:16px;font:14px sans-serif;background:#fff}main{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}figure{margin:0;height:218px;display:flex;gap:12px}img{width:400px;height:190px;object-fit:contain;background:#eee}figcaption{width:190px;overflow-wrap:anywhere}</style><main>${photos.slice(offset,offset+10).map(p=>`<figure><img src="${origin}/media/catalog-20261001/${p.key}-${p.id}.jpg"><figcaption>${escape(p.key)}<br>${p.id}<br>${escape(p.title)}</figcaption></figure>`).join('')}</main>`);
    await sheet.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    await sheet.screenshot({ path: path.join(root, `.local/catalog-enrichment/contact-${offset/10+1}.png`), fullPage: true });
  }
  await sheet.close();
  if (!process.argv.includes('--photos-only')) {
    const destinations = await get('diadiem'), hotels = await get('khachsan'), tours = await get('tour');
    const targets = [];
    for (const [kind, table, entries, all, idKey, nameKey] of [
      ['destinations','DiaDiem',manifest.destinations,destinations,'maDiaDiem','tenDiaDiem'],
      ['hotels','KhachSan',manifest.hotels,hotels,'maKhachSan','tenKhachSan'],
      ['tours','Tour',manifest.tours,tours,'maTour','tenTour'],
    ]) for (const entry of entries) {
      const matches = all.filter(row => row[nameKey] === entry.name);
      assert.equal(matches.length, 1, entry.name); const item = matches[0];
      assert.equal(item.tinhThanh || item.diemDen, entry.province);
      const expected = table === 'Tour' ? photos.filter(p=>entry.stops.includes(p.key)) : photos.filter(p=>p.key===entry.key);
      assert.equal(item.hinhAnh.length, expected.length, `${entry.name}: gallery count`);
      for (const p of expected) {
        const img = item.hinhAnh.find(i=>i.duongDan.endsWith(`/${p.key}-${p.id}.jpg`));
        assert(img, entry.name); assert.equal(img.nguon,p.source); assert.equal(img.giayPhep,p.license);
      }
      if (kind === 'tours') {
        assert.equal(Number(item.giaTour),0);
        assert.equal((await get('tourkhoihanh/bytour/'+item[idKey])).length,0);
        const stops=await get('tourchitiet/bytour/'+item[idKey]);
        assert.equal(stops.length,entry.stops.length);
        assert(stops.every(s=>s.ngayThu===1 && !s.thoiGianBatDau && !s.thoiGianKetThuc));
        assert.match(item.moTa,/không phải chương trình mở bán/i);
      } else if(kind==='hotels') assert.equal((await get('loaiphong/bykhachsan/'+item[idKey])).length,0);
      else {assert.equal(item.mienPhi,false);assert.equal(Number(item.giaVe),0);}
      await get(`feedback/${kind}/${item[idKey]}`);
      targets.push({url:`/${kind}/${item[idKey]}`, name:entry.name, count:expected.length,kind});
    }
    for (const width of [1440,390]) {
      const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
      const page=await context.newPage(); page.on('pageerror', e=>errors.push(e.message));
      page.on('response',r=>{if(r.url().includes('/api/')&&r.status()>=500)errors.push(r.status()+' '+r.url());});
      for (const target of targets) {
        await page.goto(origin+target.url);
        await page.getByRole('heading',{name:target.name,exact:true}).waitFor();
        if(target.count) {
          // A tour also contains a separate gallery for each itinerary stop.
          const gallery=page.getByRole('region',{name:'Bộ ảnh dịch vụ',exact:true}).first();
          await gallery.locator('figure.detail-photo > img').evaluate(img=>img.decode());
          if(target.count>1) {
            const first=await gallery.locator('figure.detail-photo > img').getAttribute('src');
            await gallery.getByRole('button',{name:'Ảnh tiếp →',exact:true}).click();
            await gallery.locator('figure.detail-photo > img').evaluate(img=>img.decode());
            assert.notEqual(await gallery.locator('figure.detail-photo > img').getAttribute('src'),first);
          }
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow '+target.url);
        visited.push({width,url:target.url});
      }
      await page.goto(origin+'/hotels');
      await page.getByRole('heading').first().waitFor();
      await page.screenshot({path:path.join(root,`.local/catalog-enrichment/hotels-${width}.png`),fullPage:true});
      await context.close();
    }
    assert.equal((await get('provinces')).length,34);
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({verifiedFiles:photos.length,detailPageVisits:visited.length,errors},null,2));
} finally {await browser.close();}
