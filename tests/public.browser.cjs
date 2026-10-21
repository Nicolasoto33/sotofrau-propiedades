const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let rel=decodeURIComponent(req.url.split('?')[0]);if(rel.endsWith('/'))rel+='index.html';try{const f=path.join(root,rel);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(8770,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!process.env.LIVE_UF){
await page.route('https://indicadores.cl/**',route=>route.fulfill({json:{indicador:'uf',serie:[{fecha:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago'}).format(new Date()),valor:41000}]}}));
await page.route('https://mindicador.cl/**',route=>route.abort());
}
await page.addInitScript(()=>{window.__shared=null;Object.defineProperty(navigator,'canShare',{value:()=>true});Object.defineProperty(navigator,'share',{value:async data=>{window.__shared={...data,files:data.files?.map(f=>({name:f.name,size:f.size,type:f.type}))};}});});
for(const width of [1920,1440,1024,768,390]){
await page.setViewportSize({width,height:950});await page.goto('http://127.0.0.1:8770/');await page.waitForSelector('.property-card');
await page.locator('#filtrosAvanzados summary').click();await page.locator('#filtroEstacionamiento').selectOption('si');
await page.waitForTimeout(200);assert.ok(await page.locator('#filtroBodega').isVisible());
await page.locator('#filtroTipo').selectOption({label:'Departamento'});await page.waitForTimeout(200);
assert.ok(await page.locator('.property-card:visible').count()>0);
assert.equal(await page.locator('[data-uf-status]').count(),0);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Home overflow '+width);
await page.goto('http://127.0.0.1:8770/propiedad/59/');
await page.waitForFunction(()=>document.querySelector('#conversionPrecio').textContent.includes('UF del'),{},{timeout:20000});
assert.equal(await page.locator('.contact-box [data-uf-status]').count(),0);
await page.locator('.contact-box').scrollIntoViewIfNeeded();
const bounds=await page.evaluate(()=>{const box=document.querySelector('.contact-box').getBoundingClientRect();return [...document.querySelectorAll('.contact-actions a,.contact-actions button')].every(el=>{const r=el.getBoundingClientRect();return r.left>=box.left && r.right<=box.right && r.top>=box.top && r.bottom<=box.bottom;});});
assert.ok(bounds,'Contact buttons clipped at '+width);
if(width===1440) await page.locator('.contact-box').screenshot({path:path.join(root,'../contact-fixed.png')});
await page.locator('#shareProperty').click();
await page.waitForFunction(()=>document.querySelector('#sharePhoto').naturalWidth>0);
await page.waitForFunction(()=>!document.querySelector('#sharePhotoOption').hidden);
assert.ok(await page.locator('#propertyShareDialog').isVisible());
if(width===1440) await page.locator('#propertyShareDialog').screenshot({path:path.join(root,'../share-fixed.png')});
await page.locator('#shareMore').click();
const shared=await page.evaluate(()=>window.__shared);assert.match(shared.url,/\/propiedad\/59\//);assert.ok(shared.files[0].size>0);
assert.match(await page.locator('meta[property="og:image"]').getAttribute('content'),/59/);
await page.locator('#includeSharePhoto').uncheck();
await page.locator('#shareMore').click();
assert.equal(await page.evaluate(()=>window.__shared.files),undefined);
const wa=await page.locator('#shareWhatsApp').getAttribute('href');assert.ok(decodeURIComponent(wa).includes('/propiedad/59/'));
await page.getByRole('button',{name:'Cerrar',exact:true}).click();
assert.ok(await page.locator('#shareProperty').evaluate(el=>el===document.activeElement));
assert.ok(await page.locator('a[href*="wa.me"]').count()>0);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Property overflow '+width);
}
assert.deepEqual(errors,[]);console.log('Public browser: desktop/mobile filters, sharing, contact, UF and social photo passed.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
