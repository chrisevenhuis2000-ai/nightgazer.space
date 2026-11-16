// ── Claude via de worker, maar alleen voor de twee taken van de site ───────
//
// Tot 17-11-2026 stuurde POST / elk verzoek ongefilterd door naar Anthropic,
// met onze sleutel. Wie de worker-URL kende, kon dus elk model met elke lengte
// gebruiken op onze rekening. Nu stuurt de browser alleen een taak en een
// tekst; de worker kiest zelf het model, de prompt en het maximum.
//
//   { taak: 'niveau', niveau: 'beginner' | 'amateur' | 'pro', tekst }
//       → één alinea herschreven op dat leesniveau
//   { taak: 'kantlijn', tekst }
//       → kerncijfers, kernfeiten, citaat en tussenkoppen als JSON
//
// De prompts moeten gelijk blijven aan LEVELS in types/index.ts.

export const MODEL = 'claude-haiku-4-5-20251001'
export const MAX_TEKST = 3000

export const NIVEAU_PROMPTS = {
  beginner: `Herschrijf deze alinea astronomisch nieuws in eenvoudig Nederlands voor absolute beginners. Geen vakjargon. Gebruik alledaagse analogieën. Schrijf voor een nieuwsgierige 14-jarige. Korte zinnen. Enthousiast. Geef ALLEEN de herschreven tekst terug.`,
  amateur: `Herschrijf deze alinea voor amateur-astronomen in het Nederlands. Behoud technische termen maar leg ze kort uit. Schrijf informatief en boeiend voor iemand met basiskennis van sterrenkunde. Geef ALLEEN de herschreven tekst terug.`,
  pro: `Herschrijf deze alinea in wetenschappelijk Nederlands voor astrofysici. Gebruik correcte terminologie. Voeg fysische context toe. Formele, precieze stijl. Geef ALLEEN de herschreven tekst terug.`,
}

const KANTLIJN_PROMPT = tekst => `Analyseer dit astronomie-artikel en antwoord ALLEEN met geldig JSON:
{"kerncijfers":[{"value":"compacte waarde","label":"kort label","unit":"eenheid"}],"kernfeiten":["feit 1","feit 2","feit 3"],"quote":{"text":"opvallende uitspraak in het Nederlands","author":"naam of rol"},"headings":["Sectietitel 1","Sectietitel 2"]}
Regels: kerncijfers exact 3, kernfeiten 3-5, headings exact 2, alles in het Nederlands.

Artikel:
${tekst}`

/**
 * Maakt van wat de browser stuurt het verzoek aan Anthropic.
 * Geeft { verzoek } of { fout } terug; alles wat niet precies past is een fout.
 */
export function bouwVerzoek(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { fout: 'Geen geldig verzoek.' }
  const tekst = typeof body.tekst === 'string' ? body.tekst.trim() : ''
  if (!tekst) return { fout: 'Geen tekst.' }
  if (tekst.length > MAX_TEKST) return { fout: 'Tekst te lang.' }

  if (body.taak === 'niveau') {
    const prompt = Object.hasOwn(NIVEAU_PROMPTS, body.niveau) ? NIVEAU_PROMPTS[body.niveau] : null
    if (!prompt) return { fout: 'Onbekend niveau.' }
    return { verzoek: { model: MODEL, max_tokens: 800, system: prompt, messages: [{ role: 'user', content: tekst }] } }
  }
  if (body.taak === 'kantlijn') {
    return { verzoek: { model: MODEL, max_tokens: 700, messages: [{ role: 'user', content: KANTLIJN_PROMPT(tekst) }] } }
  }
  return { fout: 'Onbekende taak.' }
}

/** Alleen het deel van het antwoord dat de site gebruikt: de tekst. */
export function snoeiAntwoord(data) {
  const tekst = data?.content?.find?.(c => c?.type === 'text')?.text
  return typeof tekst === 'string' ? { content: [{ type: 'text', text: tekst }] } : { error: 'leeg antwoord' }
}
