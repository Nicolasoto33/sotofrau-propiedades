const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
function setup(fetch){
 let now='2026-10-21T15:00:00Z'; const saved={};
 class Clock extends Date { constructor(...args){super(...(args.length?args:[now]));} static now(){return new Date(now).getTime();} }
 const context={module:{exports:{}},Date:Clock,Intl,Map,AbortController,setTimeout,clearTimeout,fetch,
 localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v}};
 vm.runInNewContext(fs.readFileSync('precios-uf.js','utf8'),context);
 return {api:context.module.exports,next:date=>now=date};
}
const response=serie=>({ok:true,json:async()=>({indicador:'uf',serie})});
test('uses published exact dates across Chile midnight without another request',async()=>{
 let calls=0; const s=setup(async()=>{calls++;return response([{fecha:'2026-10-21',valor:41190},{fecha:'2026-10-22',valor:41200}]);});
 assert.equal((await s.api.fetchRate()).value,41190);
 s.next('2026-10-22T02:59:00Z');assert.equal((await s.api.fetchRate()).value,41190);
 s.next('2026-10-22T03:01:00Z');assert.equal((await s.api.fetchRate()).value,41200);
 assert.equal(calls,1);
});
test('rejects old or future-only values, retries after failure and deduplicates',async()=>{
 let fail=true,calls=0;const s=setup(async()=>{calls++;return response([{fecha:fail?'2026-10-20':'2026-10-21',valor:41000}]);});
 await assert.rejects(s.api.fetchRate());assert.equal(calls,3);
 fail=false; const values=await Promise.all([s.api.fetchRate(),s.api.fetchRate()]);
 assert.equal(values[0].date,'2026-10-21');assert.equal(calls,4);
});
test('falls back when primary provider fails',async()=>{
 let calls=0;const s=setup(async()=>{if(++calls===1)throw Error('offline');return response([{fecha:'2026-10-21',valor:41000}]);});
 assert.equal((await s.api.fetchRate()).source,'mindicador.cl');
});
