const {test}=require('node:test');
const assert=require('node:assert/strict');
const U=require('../admin/gallery-utils');
test('ID validation rejects empty, fractions, traversal and unsafe integers',()=>{
  for(const id of ['',0,-1,1.2,'../56','01',Number.MAX_SAFE_INTEGER+1]) assert.equal(U.validId(id),false);
  assert(U.validId(56));assert(U.validId('57'));
});
test('file validation catches unsupported, empty and oversized files',()=>{
  assert.equal(U.checkFile({name:'foto.JPEG',size:100}), '');
  for(const f of [{name:'a.svg',size:100},{name:'a.heic',size:100},{name:'a.jpg',size:0},{name:'a.png',size:16*1024*1024}]) assert(U.checkFile(f));
});
test('order changes do not mutate existing data',()=>{
  const original=['a','b','c'];assert.deepEqual(U.move(original,2,0),['c','a','b']);
  assert.deepEqual(original,['a','b','c']);assert.deepEqual(U.move(original,0,-1),original);
});
test('upload failure and incorrect folder never produce a gallery route',()=>{
  for(const result of [undefined,{type:'MEDIA_PERSIST_FAILURE'},{type:'ADD_DRAFT_ENTRY_MEDIA_FILE',payload:{path:'propiedades/57/foto.jpg'}}]) assert.throws(()=>U.uploadedPath(result,56));
  assert.equal(U.uploadedPath({type:'ADD_DRAFT_ENTRY_MEDIA_FILE',payload:{path:'propiedades/56/foto.jpg'}},56),'/propiedades/56/foto.jpg');
});
test('filenames are safe and collision tokens are preserved',()=>{
  assert.equal(U.filename('../Cocina Ñ.JPG','unique'),'cocina-n-unique.jpg');
});
