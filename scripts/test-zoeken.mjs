// scripts/test-zoeken.mjs — de zoekfunctie (lib/zoeken.ts) vindt gidsen, zwermen en artikelen.
import assert from 'assert/strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ts from 'typescript'

const hier = path.dirname(fileURLToPath(import.meta.url))
const laad = (f, vervang = s => s) => {
  const js = ts.transpileModule(vervang(fs.readFileSync(path.join(hier, '../lib', f), 'utf8')), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
}
const sky = laad('sky-data.ts')
const Z = await import(laad('zoeken.ts', s => s.replace("from './sky-data'", `from '${sky}'`)))
const artikelen = JSON.parse(fs.readFileSync(path.join(hier, '../public/content/articles-index.json'), 'utf8'))

const eerste = q => Z.zoek(q, artikelen)[0]?.href
assert.equal(eerste('cadeau'), '/sterrenkijken/cadeaugids/')
assert.equal(eerste('Sinterklaas'), '/sterrenkijken/cadeaugids/')
assert.equal(eerste('hemelkalender'), '/sterrenkijken/hemelkalender/')
assert.equal(eerste('telescoop'), '/sterrenkijken/eerste-telescoop/')
assert.equal(eerste('spellen'), '/spellen/hemelfoto/')
assert.equal(Z.zoek('Leoniden', artikelen).find(t => t.soort === 'hemel')?.titel, 'Leoniden')
assert.equal(Z.zoek('perseiden', artikelen).find(t => t.soort === 'hemel')?.titel, 'Perseïden')
assert.ok(Z.zoek('ISS', artikelen).filter(t => t.soort === 'artikel').every(t => /\biss\b/i.test(t.titel + ' ' + (artikelen.find(a => `/nieuws/${a.slug}/` === t.href)?.excerpt ?? ''))), 'ISS alleen als heel woord')
assert.equal(Z.past('Nieuwe missie naar Mars', 'iss'), false)
assert.equal(Z.past('Het ISS boven Utrecht', 'iss'), true)
assert.equal(Z.zoek('xqzv', artikelen).length, 0)
assert.equal(Z.GIDSEN.length, 4)
console.log('zoeken: 12 checks ok')
