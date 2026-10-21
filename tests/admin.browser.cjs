const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{
 let rel=decodeURIComponent(req.url.split('?')[0]); if(rel.endsWith('/')) rel+='index.html';
 let file=path.join(root,rel);
 if(rel==='/decap.js')file=process.env.DECAP_BUNDLE || path.join(__dirname,'vendor/decap-cms.js');
 if(rel==='/backend-test.js')file=path.join(__dirname,'test-backend.js');
 try{let body=fs.readFileSync(file);
 if(rel==='/admin/index.html')body=body.toString().replace('https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js','/decap.js').replace('<script src="/admin/gallery-utils.js">','<script src="/backend-test.js"></script><script src="/admin/gallery-utils.js">');
 if(rel==='/admin/config.yml')body=body.toString().replace('name: github','name: test');
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.yml':'text/yaml','.json':'application/json','.jpeg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body);
 }catch{res.statusCode=404;res.end('Not found');}
});
(async()=>{
 await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.log('PAGEERROR',e);});page.on('console',async m=>{if(m.type()==='error')console.log('CONSOLE',m.text(),await Promise.all(m.args().map(a=>a.jsonValue().catch(()=>null))));});
 try{
 await page.goto('http://127.0.0.1:8765/admin/');
 await page.getByRole('button',{name:'Login test'}).click();
 await page.getByText('＋ Propiedad',{exact:true}).click();
 await page.waitForTimeout(800);
 await page.locator('input[id^="id-field-"]').fill('999');
 await page.locator('input[id^="titulo-field-"]').fill('Departamento de prueba');
 await page.locator('input[id^="ubicacion-field-"]').fill('Viña del Mar');
 await page.locator('input[id^="precio-field-"]').fill('$500.000');
 await page.locator('[id^="operacion-field-"]').click();
 await page.getByText('Arriendo',{exact:true}).click();
 await page.locator('[id^="estado-field-"]').click();
 await page.getByRole('option',{name:'Disponible',exact:true}).click();
 const photo=fs.readFileSync(path.join(root,'propiedades/56/1.jpeg'));
 await page.getByLabel('Seleccionar varias fotos',{exact:true}).setInputFiles([
  {name:'primera.jpeg',mimeType:'image/jpeg',buffer:photo},
  {name:'segunda.jpeg',mimeType:'image/jpeg',buffer:fs.readFileSync(path.join(root,'propiedades/56/2.jpeg'))},
  {name:'tercera.jpeg',mimeType:'image/jpeg',buffer:fs.readFileSync(path.join(root,'propiedades/56/3.jpeg'))}
 ]);
 await page.getByText('3 foto(s) agregada(s). Guarda el borrador para conservarlas.',{exact:true}).waitFor();
 assert.equal(await page.locator('.sf-photo').count(),3);
 await page.locator('.sf-gallery').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('.sf-gallery img')).every(i=>i.naturalWidth>0));
 await page.getByLabel('Seleccionar varias fotos',{exact:true}).setInputFiles([{name:'duplicada.jpeg',mimeType:'image/jpeg',buffer:photo},{name:'invalida.heic',mimeType:'image/heic',buffer:photo}]);
 await page.getByText(/se omitió el duplicado/).waitFor();
 await page.getByText(/Convierte las fotos HEIC/).waitFor();
 assert.equal(await page.locator('.sf-photo').count(),3);
 await page.getByRole('button',{name:'Mover foto 3 antes',exact:true}).click();
 await page.getByRole('button',{name:'Quitar foto 2',exact:true}).click();
 await page.getByRole('button',{name:'Deshacer última eliminación'}).click();
 await page.locator('.sf-cover summary').click();
 await page.locator('.sf-cover-choice').nth(1).click();
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await page.waitForFunction(()=>window.savedEntry,{},{timeout:5000});
 const saved=await page.evaluate(()=>window.savedEntry);
 const entry=JSON.parse(saved.data[0].raw);
 assert.equal(entry.fotos.length,3);assert.equal(saved.assets.length,3);assert.equal(saved.options.useWorkflow,true);
 assert.deepEqual(entry.fotos.map(p=>p.split('/').pop().split('-')[0]),['primera','tercera','segunda']);
 assert.equal(entry.imagen,entry.fotos[1]);
 assert(entry.fotos.every(p=>typeof p==='string' && p.startsWith('/propiedades/999/')));
 assert(saved.assets.every(a=>a.path.startsWith('propiedades/999/') && a.fileSize>0));
 // Save navigates to the newly created entry. Test double must serve that entry on reload.
 await page.waitForTimeout(300);
 await page.waitForTimeout(400);
 assert.deepEqual(errors,[]);
 await page.locator('#sf-jump').selectOption('fotos');
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(require('os').tmpdir(),'sotofrau-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(400);
 await page.screenshot({path:path.join(require('os').tmpdir(),'sotofrau-mobile.png')});
 const bounds=await page.getByRole('button',{name:'Guardar',exact:true}).boundingBox();assert(bounds.x>=0 && bounds.x+bounds.width<=390);
 const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,panes:Array.from(document.querySelectorAll('.Pane')).map(p=>p.getBoundingClientRect().width)}));
 assert.equal(dimensions.scroll,dimensions.width);assert(dimensions.panes.every(w=>w===390));
 // Existing property round-trip: only the edited title may change.
 const existing=await browser.newPage({viewport:{width:390,height:844}});
 const fixture=JSON.parse(fs.readFileSync(path.join(root,'content/propiedades/56.json'),'utf8'));
 await existing.addInitScript(f=>{localStorage.setItem('cms.preview-visible','false');window.testEntries=[{data:JSON.stringify(f),file:{path:'content/propiedades/56.json',id:'56'}}];},fixture);
 await existing.goto('http://127.0.0.1:8765/admin/#/collections/propiedades/entries/56');
 await existing.getByRole('button',{name:'Login test'}).click();
 await existing.locator('input[id^="titulo-field-"]').fill('Título de prueba actualizado');
 await existing.getByRole('button',{name:'Guardar',exact:true}).click();
 await existing.waitForFunction(()=>window.savedEntry);
 assert.equal(await existing.locator('.Pane').count(),0);
 assert.equal(await existing.evaluate(()=>document.documentElement.scrollWidth),390);
 const roundTrip=await existing.evaluate(()=>JSON.parse(window.savedEntry.data[0].raw));
 assert.deepEqual(roundTrip,{...fixture,titulo:'Título de prueba actualizado'});
 await existing.locator('input[id^="id-field-"]').fill('57');
 await existing.getByRole('button',{name:'Guardar',exact:true}).click();
 await existing.getByText('No cambies el ID de una propiedad existente: identifica su ficha y su carpeta de fotos.',{exact:false}).waitFor();
 assert.equal(await existing.evaluate(()=>JSON.parse(window.savedEntry.data[0].raw).id),56);
 await existing.close();
 console.log('PASS: multiple upload, image decoding, duplicate/HEIC rejection, reorder, removal/undo, cover, JSON/assets/workflow, 390px layout, existing property round-trip.');

 }catch(e){await page.screenshot({path:path.join(require('os').tmpdir(),'sotofrau-failure.png')});console.log('FAIL BODY',await page.locator('body').innerText());console.log('ERRORS',errors);throw e;}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

