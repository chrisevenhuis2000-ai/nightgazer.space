// scripts/test-geminiden.mjs
// Tel de Geminiden: keuring van een telling en de uitslag (cf-worker/geminiden.mjs).
import assert from 'assert/strict'
import { keurTelling, uitslag, TEL_OPEN, TEL_DICHT, PROVINCIES, HEMEL } from '../cf-worker/geminiden.mjs'
import { readFileSync } from 'fs'

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const nacht = TEL_OPEN + 6 * 3600e3
const goed = { provincie: 'Utrecht', hemel: 'Helder', aantal: 30, minuten: 60, uur: 23 }

ok(keurTelling(goed, nacht).meta?.n === 30, 'goede telling')
ok(keurTelling(goed, TEL_OPEN - 1).fout, 'te vroeg')
ok(keurTelling(goed, TEL_DICHT + 1).fout, 'te laat')
ok(keurTelling({ ...goed, provincie: 'Mars' }, nacht).fout, 'onbekende provincie')
ok(keurTelling({ ...goed, aantal: -1 }, nacht).fout, 'negatief')
ok(keurTelling({ ...goed, aantal: 2.5 }, nacht).fout, 'geen geheel getal')
ok(keurTelling({ ...goed, minuten: 5 }, nacht).fout, 'te kort gekeken')
ok(keurTelling({ ...goed, aantal: 300, minuten: 30 }, nacht).fout, 'onmogelijk veel')
ok(keurTelling(null, nacht).fout, 'leeg')

const u = uitslag([
  { p: 9, h: 0, n: 30, m: 60, u: 23 },
  { p: 9, h: 1, n: 10, m: 60, u: 22 },
  { p: 3, h: 0, n: 60, m: 60, u: 4 },
  null,
])
ok(u.tellingen === 3 && u.meteoren === 100 && u.minuten === 180, 'totalen')
ok(u.perUur === 33.3, 'gemiddeld per uur')
ok(u.perUurHelder === 45, 'per uur bij heldere hemel')
ok(u.provincies[0].naam === 'Gelderland' && u.provincies[1].tellingen === 2, 'provincies op meteoren')
ok(uitslag([]).perUur === 0, 'lege uitslag')

// De site en de worker gebruiken dezelfde lijsten en tijden.
const site = readFileSync(new URL('../lib/omhoog.ts', import.meta.url), 'utf8')
for (const p of PROVINCIES) ok(site.includes(`'${p}'`), `provincie ${p} op de site`)
for (const h of HEMEL) ok(site.includes(`'${h}'`), `hemel ${h} op de site`)
ok(site.includes(`TEL_OPEN = '${new Date(TEL_OPEN).toISOString().replace('.000', '')}'`), 'zelfde openingstijd')
ok(site.includes(`TEL_DICHT = '${new Date(TEL_DICHT).toISOString().replace('.000', '')}'`), 'zelfde sluitingstijd')

console.log(`geminiden: ${n} controles in orde`)
