// scripts/test-cadeautijd.mjs — welke tekst het cadeaublok op welke dag toont (lib/cadeautijd.ts).
import assert from 'assert/strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ts from 'typescript'

const hier = path.dirname(fileURLToPath(import.meta.url))
const bron = fs.readFileSync(path.join(hier, '../lib/cadeautijd.ts'), 'utf8')
const js = ts.transpileModule(bron, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const C = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

const verwacht = {
  '2026-10-31': 'uit', '2026-11-01': 'sint', '2026-12-05': 'sint', '2026-12-06': 'kerst',
  '2026-12-24': 'kerst', '2026-12-25': 'januari', '2027-01-31': 'januari', '2027-02-01': 'uit', '2027-07-15': 'uit',
}
for (const [dag, s] of Object.entries(verwacht)) assert.equal(C.seizoen(dag), s, dag)
for (const s of ['sint', 'kerst', 'januari']) assert.ok(C.SEIZOEN_TEKST[s].length > 20, s)
console.log(`cadeautijd: ${Object.keys(verwacht).length + 3} checks ok`)
