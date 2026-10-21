const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let rel=decodeURIComponent(req.url.split('?')[0]);if(rel.endsWith('/'))rel+='index.html';try{const f=path.join(root,rel);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.jpeg':'image/jpeg','.jpg':'image/jpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(8770,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!process.env.LIVE_UF){
await page.route('https://indicadores.cl/**',route=>route.fulfill({json:{indicador:'uf',serie:[{fecha:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago'}).format(new Date()),valor:41000}]}}));
await page.route('https://mindicador.cl/**',route=>route.abort());
}
await page.addInitScript(()=>{window.__shared=null;Object.defineProperty(navigator,'share',{value:async data=>{window.__shared=data;}});});
for(const width of [1440,390]){
await page.setViewportSize({width,height:950});await page.goto('http://127.0.0.1:8770/');await page.waitForSelector('.property-card');
await page.locator('#filtrosAvanzados summary').click();await page.locator('#filtroEstacionamiento').selectOption('si');
await page.waitForTimeout(200);assert.ok(await page.locator('#filtroBodega').isVisible());
await page.locator('#filtroTipo').selectOption({label:'Departamento'});await page.waitForTimeout(200);
assert.ok(await page.locator('.property-card:visible').count()>0);
await page.waitForFunction(()=>document.querySelector('[data-uf-status]').textContent.includes('Fuente:'),{},{timeout:20000});
assert.match(await page.locator('[data-uf-status]').innerText(),process.env.LIVE_UF?/UF del .*\$/ : /41.000,00/);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Home overflow '+width);
await page.goto('http://127.0.0.1:8770/propiedad/56/');await page.locator('#shareProperty').click();
const shared=await page.evaluate(()=>window.__shared);assert.match(shared.url,/\/propiedad\/56\//);
assert.match(await page.locator('meta[property="og:image"]').getAttribute('content'),/56/);
assert.ok(await page.locator('a[href*="wa.me"]').count()>0);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Property overflow '+width);
}
assert.deepEqual(errors,[]);console.log('Public browser: desktop/mobile filters, sharing, contact, UF and social photo passed.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
