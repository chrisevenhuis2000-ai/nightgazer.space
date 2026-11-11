// scripts/generate-agenda.mjs — schrijft public/agenda/meteorenzwermen.ics
//
// Een vast agendabestand met de komende meteorenzwermen. Een gewone link naar
// een .ics opent op de iPhone en Android direct "Voeg alles toe", ook in de
// browser van Instagram, waar een download via JavaScript vaak niets doet.
// Draait in prebuild, dus het bestand is zo vers als de laatste build.
//
// shortcut: alleen de zwermen van SHOWER_YEAR die nog moeten komen; na de
// Ursiden (eind december) is het bestand leeg tot de data een jaar verder
// staat. Lanceringen staan er niet in: hun data schuiven te vaak.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ts from 'typescript'

const hier = path.dirname(fileURLToPath(import.meta.url))
const laad = f => {
  const js = ts.transpileModule(fs.readFileSync(path.join(hier, '../lib', f), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
}
const { METEORS, zwermAgenda } = await import(laad('sky-data.ts'))
const { buildIcs } = await import(laad('ics.ts'))

const nu = new Date()
const items = METEORS.map(zwermAgenda).filter(e => e.end >= nu)
const uit = path.join(hier, '../public/agenda/meteorenzwermen.ics')
fs.mkdirSync(path.dirname(uit), { recursive: true })
fs.writeFileSync(uit, buildIcs(items, 'NightGazer · meteorenzwermen'))
console.log(`agenda: ${items.length} zwermen in ${path.relative(process.cwd(), uit)}`)
