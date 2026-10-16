// ── GitHub-workflows starten vanuit de Worker-cron ─────────────────────────
// GitHub start geplande workflows (on: schedule) vaak uren te laat, en slaat
// er soms een dag over. De Worker-cron is wél op tijd: om 07:17 en 07:43 UTC
// start hij fetch-articles en update-missions via workflow_dispatch.
//
// De schedule-triggers in de workflows blijven als vangnet. Om dubbel werk te
// voorkomen stopt een workflow meteen als er die dag al een geslaagde run
// van dezelfde workflow was (zie de job "vandaag" in de workflows).
//
// Nodig: een fine-grained token als Worker-secret GITHUB_DISPATCH_TOKEN, met
// alleen toegang tot deze repo en Actions: Read and write. Zonder token doet
// de cron niets en logt dat.

export const REPO = 'chrisevenhuis2000-ai/nightgazer.space'

/** Cron-expressie (zoals in wrangler.toml) → workflowbestand. */
export const WORKFLOW_CRONS = {
  '17 7 * * *': 'fetch-articles.yml',
  '43 7 * * *': 'update-missions.yml',
}

/**
 * Start één workflow op main. → { ok, status, melding }
 * Gooit nooit: een cron die faalt mag de Worker niet laten struikelen.
 */
export async function startWorkflow(env, bestand, fetchFn = fetch) {
  if (!env.GITHUB_DISPATCH_TOKEN) {
    const melding = `GITHUB_DISPATCH_TOKEN ontbreekt; ${bestand} niet gestart`
    console.warn(melding)
    return { ok: false, status: 0, melding }
  }
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${bestand}/dispatches`
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization:          `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
        Accept:                 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent':           'nightgazer-worker',
        'Content-Type':         'application/json',
      },
      // bron=worker: de workflow weet zo dat hij een dubbele run moet
      // overslaan; een handmatige run uit GitHub draait altijd.
      body: JSON.stringify({ ref: 'main', inputs: { bron: 'worker' } }),
    })
    if (res.status === 204) {
      console.log(`${bestand} gestart`)
      return { ok: true, status: 204, melding: `${bestand} gestart` }
    }
    const tekst = (await res.text().catch(() => '')).slice(0, 300)
    const melding = `${bestand} niet gestart: GitHub ${res.status} ${tekst}`
    console.error(melding)
    return { ok: false, status: res.status, melding }
  } catch (err) {
    const melding = `${bestand} niet gestart: ${String(err?.message || err)}`
    console.error(melding)
    return { ok: false, status: 0, melding }
  }
}
