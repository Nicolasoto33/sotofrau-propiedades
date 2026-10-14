const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const uf = require('../precios-uf.js');

(async () => {
  assert.equal(uf.parsePrice('3.660 UF').amount, 3660);
  assert.equal(uf.parsePrice('UF 12,5').amount, 12.5);
  assert.equal(uf.parsePrice('$800.000 mensuales.').monthly, true);
  assert.equal(uf.parsePrice('Desde 3.998 UF').from, true);
  for (const value of ['950.000', 'Consultar', 'USD 100', '$400 UF', '10-20 UF', '0 UF', '3.66 UF']) {
    assert.equal(uf.parsePrice(value), null, value);
  }
  const rate = { date: '2026-10-06', value: 40000 };
  assert.match(uf.equivalence(uf.parsePrice('3.660 UF'), rate), /146\.400\.000 CLP.*06\/10\/2026/);
  assert.match(uf.equivalence(uf.parsePrice('$800.000 mensuales.'), rate), /20,00 UF mensuales/);
  assert.match(uf.equivalence(uf.parsePrice('Desde $600.000'), rate), /^Desde ≈/);
  assert.equal(uf.day(new Date('2026-10-06T02:00:00Z')), '2026-10-05');
  assert.equal(uf.validRate(rate, '2026-10-07'), false);
  assert.equal(uf.validLatestRate(rate, '2026-10-07'), true);
  assert.equal(uf.validLatestRate({date: '2026-10-08', value: 1}, '2026-10-07'), false);
  assert.equal(uf.parsePrice('$550.000 mensuales.').monthly, true);
  assert.equal(uf.validRate({date: rate.date, value: -1}, rate.date), false);
  let calls = 0;
  let saved;
  global.localStorage = { getItem: () => saved || null, setItem: (_, value) => { saved = value; } };
  const today = uf.day();
  const previousDay = new Date(Date.now() - 86400000);
  const previousParts = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(previousDay);
  const previousDate = `${previousParts.find(p => p.type === 'year').value}-${previousParts.find(p => p.type === 'month').value}-${previousParts.find(p => p.type === 'day').value}`;
  global.fetch = async () => {
    calls++;
    return { ok: true, json: async () => ({ codigo: 'uf', serie: [{ fecha: `${previousDate}T00:00:00.000Z`, valor: 39999 }] }) };
  };
  const rates = await Promise.all([uf.fetchRate(), uf.fetchRate()]);
  assert.equal(calls, 1);
  assert.equal(rates[0].date, previousDate);
  assert.equal(rates[0].value, 39999);
  await uf.fetchRate();
  assert.equal(calls, 1);
  const prices = fs.readdirSync(path.join(__dirname, '../content/propiedades')).filter(f => f.endsWith('.json'));
  const unsupported = prices.filter(f => {
    const property = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/propiedades', f)));
    return !uf.propertyPrice(property.precio, property.id);
  });
  assert.deepEqual(unsupported, []);
  assert.equal(uf.propertyPrice('950.000', 36).amount, 950000);
  assert.equal(uf.propertyPrice('950.000', 36).currency, 'CLP');
  assert.equal(uf.propertyPrice('950.000', 37), null);
  // Fresh module to exercise stale cache and malformed/offline upstream behavior.
  delete require.cache[require.resolve('../precios-uf.js')];
  const fresh = require('../precios-uf.js');
  saved = JSON.stringify(rate);
  if (rate.date === today) saved = JSON.stringify({...rate, date: '2000-01-01'});
  global.fetch = async () => ({ok: true, json: async () => ({codigo: 'uf', serie: [{fecha: '2000-01-01', valor: 40000}]})});
  await assert.rejects(fresh.fetchRate());
  global.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(fresh.fetchRate());
  global.fetch = async () => ({ok: true, json: async () => ({codigo: 'uf', serie: [{fecha: today, valor: -1}]})});
  await assert.rejects(fresh.fetchRate());
  console.log('OK: conversions, Chilean formats, dates, shared request, cache, stale/malformed data and offline failure. Property 36 confirmed CLP; all 53 existing prices supported.');
})().catch(error => { console.error(error); process.exitCode = 1; });
