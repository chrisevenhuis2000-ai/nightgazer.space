// scripts/test-workflow-start.js
// De Worker-cron die fetch-articles en update-missions start
// (cf-worker/workflows.mjs + scheduled() in worker.js), met een nagebootste
// fetch:
//   1. 17 7 → fetch-articles.yml, 43 7 → update-missions.yml: POST naar de
//      dispatches-URL op main met inputs.bron=worker, token als Bearer.
//   2. */15 start niets (pushmeldingen).
//   3. Zonder GITHUB_DISPATCH_TOKEN: geen request, wel een logregel.
//   4. Fout van GitHub (401/404) of netwerkfout: gelogd, geen exception.
//   5. wrangler.toml heeft precies de crons uit WORKFLOW_CRONS (plus */15),
//      en de workflowbestanden hebben workflow_dispatch met input bron, de
//      schedule als vangnet en de check "vandaag al geslaagd → stoppen".

const fs = require('fs')
const os = require('os')
const path = require('path')
const assert = require('assert/strict')

let checks = 0
const ok = (c, m) => { assert.ok(c, m); checks++ }
const eq = (a, b, m) => { assert.deepEqual(a, b, m); checks++ }
const ROOT = path.join(__dirname, '..')

;(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-start-'))
  for (const f of fs.readdirSync(path.join(ROOT, 'cf-worker')).filter(f => f.endsWith('.mjs'))) fs.copyFileSync(path.join(ROOT, 'cf-worker', f), path.join(dir, f))
  fs.copyFileSync(path.join(ROOT, 'cf-worker', 'worker.js'), path.join(dir, 'worker.mjs'))
  const W = await import(path.join(dir, 'workflows.mjs'))
  const worker = (await import(path.join(dir, 'worker.mjs'))).default

  let verzoeken = []
  let antwoord = () => new Response(null, { status: 204 })
  globalThis.fetch = async (url, init = {}) => { verzoeken.push({ url: String(url), init }); return antwoord() }
  const logs = []
  for (const k of ['log', 'warn', 'error']) console[k] = (...a) => logs.push(`${k}: ${a.join(' ')}`)

  const cron = async (expr, env = { GITHUB_DISPATCH_TOKEN: 'geheim' }) => {
    const wacht = []
    await worker.scheduled({ cron: expr, scheduledTime: Date.now() }, env, { waitUntil: p => wacht.push(p) })
    await Promise.all(wacht)
  }

  // ── 1. De twee crons ───────────────────────────────────────────────────
  for (const [expr, bestand] of [['17 7 * * *', 'fetch-articles.yml'], ['43 7 * * *', 'update-missions.yml']]) {
    verzoeken = []
    await cron(expr)
    eq(verzoeken.length, 1, `${expr}: één request`)
    const v = verzoeken[0]
    eq(v.url, `https://api.github.com/repos/chrisevenhuis2000-ai/nightgazer.space/actions/workflows/${bestand}/dispatches`, `${expr}: dispatches-URL van ${bestand}`)
    eq(v.init.method, 'POST', `${expr}: POST`)
    eq(v.init.headers.Authorization, 'Bearer geheim', `${expr}: token als Bearer`)
    eq(v.init.headers['X-GitHub-Api-Version'], '2022-11-28', `${expr}: API-versie`)
    ok(v.init.headers['User-Agent'], `${expr}: User-Agent (GitHub weigert zonder)`)
    eq(JSON.parse(v.init.body), { ref: 'main', inputs: { bron: 'worker' } }, `${expr}: op main, bron=worker`)
  }

  // ── 2. */15 start niets ────────────────────────────────────────────────
  verzoeken = []
  await cron('*/15 * * * *', { GITHUB_DISPATCH_TOKEN: 'geheim' })
  ok(!verzoeken.some(v => v.url.includes('/dispatches')), '*/15: geen workflow gestart')

  // ── 3. Zonder token ────────────────────────────────────────────────────
  verzoeken = []; logs.length = 0
  await cron('17 7 * * *', {})
  eq(verzoeken.length, 0, 'zonder token: geen request')
  ok(logs.some(l => /GITHUB_DISPATCH_TOKEN ontbreekt; fetch-articles.yml niet gestart/.test(l)), 'zonder token: logregel')

  // ── 4. Fouten ──────────────────────────────────────────────────────────
  for (const [status, tekst] of [[401, 'Bad credentials'], [404, 'Not Found'], [422, 'Workflow does not have workflow_dispatch trigger']]) {
    antwoord = () => new Response(JSON.stringify({ message: tekst }), { status })
    logs.length = 0
    const r = await W.startWorkflow({ GITHUB_DISPATCH_TOKEN: 'x' }, 'fetch-articles.yml')
    ok(!r.ok && r.status === status && r.melding.includes(tekst), `GitHub ${status}: niet gestart, melding met "${tekst}"`)
    ok(logs.some(l => l.startsWith('error:') && l.includes(String(status))), `GitHub ${status}: gelogd als fout`)
  }
  globalThis.fetch = async () => { throw new Error('netwerk weg') }
  const r = await W.startWorkflow({ GITHUB_DISPATCH_TOKEN: 'x' }, 'update-missions.yml')
  ok(!r.ok && /netwerk weg/.test(r.melding), 'netwerkfout: geen exception, wel een melding')
  let gooit = false
  try { await cron('43 7 * * *') } catch { gooit = true }
  eq(gooit, false, 'netwerkfout: scheduled() gooit niet')

  // ── 5. Config ──────────────────────────────────────────────────────────
  const toml = fs.readFileSync(path.join(ROOT, 'cf-worker', 'wrangler.toml'), 'utf-8')
  const crons = JSON.parse((/^crons\s*=\s*(\[.*\])/m.exec(toml) || [])[1] || '[]')
  eq(crons.filter(c => c !== '*/15 * * * *').sort(), Object.keys(W.WORKFLOW_CRONS).sort(), 'wrangler.toml: crons gelijk aan WORKFLOW_CRONS')
  ok(crons.includes('*/15 * * * *'), 'wrangler.toml: push-cron blijft')
  for (const bestand of Object.values(W.WORKFLOW_CRONS)) {
    const wf = path.join(ROOT, '.github', 'workflows', bestand)
    ok(fs.existsSync(wf) && /workflow_dispatch/.test(fs.readFileSync(wf, 'utf-8')), `${bestand}: bestaat en heeft workflow_dispatch`)
    const y = fs.readFileSync(wf, 'utf-8')
    ok(/^\s+bron:\s*$/m.test(y) && /default: 'handmatig'/.test(y), `${bestand}: input bron (standaard handmatig)`)
    ok(/^\s+- cron: '/m.test(y), `${bestand}: schedule blijft als vangnet`)
    ok(/^  vandaag:\s*$/m.test(y) && /needs: vandaag/.test(y) && /if: needs\.vandaag\.outputs\.al_gedaan != 'true'/.test(y), `${bestand}: hoofdjob wacht op de vandaag-check`)
    ok(y.includes(`actions/workflows/${bestand}/runs`) && /status=success/.test(y) && /created=">=\$\{vandaag\}"/.test(y), `${bestand}: check zoekt geslaagde runs van vandaag van zichzelf`)
  }

  fs.rmSync(dir, { recursive: true, force: true })
  process.stdout.write(`✅ ${checks} workflow-start-controles geslaagd\n`)
})().catch(e => { process.stderr.write(String(e?.stack || e) + '\n'); process.exit(1) })
