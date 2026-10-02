// Read-only: verifies selected assets, public API links and actual browser decoding.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'frontend/package.json'));
const {chromium}=require('@playwright/test');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const photos=read('backend/Data/photo-coverage-20261002.json');
assert(!(process.argv.includes('--photos-only')&&process.argv.includes('--require-complete')),'--require-complete needs live API coverage, not --photos-only');
const origin='http://127.0.0.1:5173';
const folder=path.join(root,'.local/photo-coverage');fs.mkdirSync(folder,{recursive:true});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch();let visits=0;const errors=[],coverage=[];
async function get(url){const r=await fetch(origin+'/api/'+url);assert.equal(r.status,200,url);return r.json();}
try{
  for(const p of photos){
    const file=`${p.key}-${p.id}.jpg`,meta=read('backend/Data/photo-sources/'+file+'.source.json');
    assert.equal(meta.Title,p.title);assert.equal(meta.Nguon,p.source);assert.equal(meta.TacGia,p.author);assert.equal(meta.GiayPhep,p.license);
    assert.equal(meta.MoTa,p.caption);assert.equal(meta.UrlGiayPhep,p.licenseUrl);
    assert.equal(meta.Sha256,hash(fs.readFileSync(path.join(root,'backend/wwwroot',meta.DuongDan))));
    const r=await fetch(origin+meta.DuongDan);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^image\/jpeg/);
    assert.equal(hash(Buffer.from(await r.arrayBuffer())),meta.Sha256);
  }
  const sheet=await browser.newPage({viewport:{width:1300,height:1180}});
  for(let offset=0;offset<photos.length;offset+=10){
    await sheet.setContent(`<style>body{margin:16px;font:14px sans-serif}main{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;display:flex;height:218px;gap:12px}img{width:400px;height:190px;object-fit:contain;background:#eee}figcaption{width:190px;overflow-wrap:anywhere}</style><main>${photos.slice(offset,offset+10).map(p=>`<figure><img src="${origin}/media/coverage-20261002/${p.key}-${p.id}.jpg"><figcaption>${escape(p.name)}<br>${p.id}<br>${escape(p.caption)}</figcaption></figure>`).join('')}</main>`);
    await sheet.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    await sheet.screenshot({path:path.join(folder,`contact-${offset/10+1}.png`),fullPage:true});
  }
  await sheet.close();
  if(!process.argv.includes('--photos-only')){
    const targets=[],allUrls=new Set();
    for(const [kind,endpoint,idKey,nameKey] of [['destinations','diadiem','maDiaDiem','tenDiaDiem'],['restaurants','nhahang','maNhaHang','tenNhaHang'],['tours','tour','maTour','tenTour']]){
      const rows=(await get(endpoint)).filter(r=>kind==='tours'?r.trangThai==='Active':Boolean(r.trangThai));
      coverage.push({kind,total:rows.length,withImages:rows.filter(r=>r.hinhAnh?.length).length,missing:rows.filter(r=>!r.hinhAnh?.length).map(r=>({id:r[idKey],name:r[nameKey]}))});
      for(const row of rows){
        for(const img of row.hinhAnh||[])allUrls.add(img.duongDan);
        const added=(row.hinhAnh||[]).filter(i=>i.duongDan.startsWith('/media/coverage-20261002/'));
        if(added.length){
          targets.push({url:`/${kind}/${row[idKey]}`,name:row[nameKey]});
          if(kind==='tours'){
            const stops=await get('tourchitiet/bytour/'+row[idKey]);
            const stopUrls=new Set(stops.flatMap(s=>(s.hinhAnh||[]).map(p=>p.duongDan)));
            for(const img of added)assert(stopUrls.has(img.duongDan),'tour image must belong to an actual stop');
          }
        }
      }
      if(kind==='destinations')for(const p of photos.filter(p=>p.kind==='DiaDiem')){
        const matches=rows.filter(r=>r[nameKey]===p.name&&r.tinhThanh===p.province);assert.equal(matches.length,1);
        const image=matches[0].hinhAnh.find(i=>i.duongDan===`/media/coverage-20261002/${p.key}-${p.id}.jpg`);
        assert(image,p.name);assert.equal(image.nguon,p.source);assert.equal(image.giayPhep,p.license);
      }
    }
    // Check every existing catalog image too, not only newly downloaded files.
    const decoder=await browser.newPage();await decoder.goto(origin);
    for(const url of allUrls)await decoder.evaluate(async url=>{const img=new Image();img.src=url;await img.decode();if(!img.naturalWidth)throw Error(url);},url);
    await decoder.close();
    for(const width of [1440,390]){
      const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.url().includes('/api/')&&r.status()>=500)errors.push(r.status()+' '+r.url());});
      for(const t of targets){
        await page.goto(origin+t.url);await page.getByRole('heading',{name:t.name,exact:true}).waitFor();
        await page.getByRole('region',{name:'Bộ ảnh dịch vụ',exact:true}).first().locator('figure.detail-photo > img').evaluate(img=>img.decode());
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.url);visits++;
      }
      await page.close();
    }
    console.log('Verified decoded catalog image URLs:',allUrls.size);
  }
  assert.deepEqual(errors,[]);
  const result={verifiedFiles:photos.length,detailVisits:visits,errors,coverage};
  fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  if(process.argv.includes('--require-complete'))assert(coverage.every(c=>c.missing.length===0),'Catalog still has missing images; see report');
}finally{await browser.close();}
