// Runs after generation: do not publish an incomplete/older public site.
const fs=require('node:fs'),assert=require('node:assert/strict');
const home=fs.readFileSync('index.html','utf8');
for(const id of ['filtroOperacion','filtroEstado','filtroUbicacion','filtroTipo','filtroDormitorios','filtroBanos','filtroMoneda','filtroPrecioMin','filtroPrecioMax','filtroEstacionamiento','filtroBodega','filtroAmoblado','filtroMascotas','filtroTerraza','filtroOrientacion','filtroSuperficieMin','filtroSuperficieMax','filtroGastosComunes','filtroOrden'])assert.ok(home.includes(`id="${id}"`),'Missing filter '+id);
for(const file of fs.readdirSync('content/propiedades').filter(x=>x.endsWith('.json'))){
 const p=JSON.parse(fs.readFileSync('content/propiedades/'+file));if(!p.publicada)continue;
 const html=fs.readFileSync(`propiedad/${p.id}/index.html`,'utf8');
 assert.ok(html.includes('id="shareProperty"'),'Missing share '+p.id);
 assert.ok(html.includes('wa.me/'),'Missing contact '+p.id);
 const image=html.match(/property="og:image"\s+content="([^"]+)"/);
 assert.ok(image,'Missing social image '+p.id);
 if(p.imagen) assert.ok(decodeURIComponent(image[1]).includes(p.imagen.replace(/^\/+/,'')),'Wrong social photo '+p.id);
 assert.ok(html.includes('data-uf-status'),'Missing UF status '+p.id);
}
const config=fs.readFileSync('admin/config.yml','utf8');
assert.ok(config.includes('branch: contenido-borradores'));
assert.ok(config.includes('editorial_workflow'));
console.log('Verified filters, sharing, contact, property social photos, UF and CMS configuration.');
