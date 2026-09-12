---
version: 1
slug: "app-staging-artikel-page-tsx"
primary_target: "app/staging/artikel/page.tsx"
related_targets: ["app/staging/artikel/ArtikelStaging.tsx","lib/article-data.ts"]
---

Scope: de artikelpagina, /staging/artikel?slug=…, zesde surface. Visitor mode: Read.

Audience: de lezer die één artikel opent, vaak vanaf Google of social. Job: het stuk begrijpen op de eigen diepte. Constraints: AdSense blijft, wereld uit DESIGN.md, chrome uit shared.tsx, parser uit lib/article-data.ts.

## Direction contract

THESIS: het artikel ontwikkelt zich als een plaat in de donkere kamer, en het leesniveau is de belichting. Weigert de niveauschakelaar als knoppenrij waarna de tekst zonder uitleg verspringt.

OWN-WORLD: ongewijzigd uit DESIGN.md. Toevoeging is een driestandenstaat per alinea: latent (wachtend op herschrijving, onscherp maar leesbaar), ontwikkeld, of mislukt. Origineel draagt geen ladder maar een leeg kader: de onbewerkte afdruk.

STORY: de lezer kiest een belichting, ziet elke alinea één voor één scherp worden, en leest met kerncijfers, kernfeiten en het citaat in de kantlijn. De leesvoortgang vult een randlineaal onder de balk. Onderaan hangt de contactstrip met verwante platen.

FIRST VIEWPORT: staging-balk, kop, belichtingsbalk met vier standen en de voortgangslineaal. Dan de leesplaat: plaatnummer en envelopregel, de kop, het beeld op 21:9, en de eerste alinea op 813px.

FORM: de ontwikkelstrook, kandidaat 5 van zeven gegronde structuren (geannoteerde afdruk, niveau-afdruk, dubbeldruk, leesspoor, ontwikkelstrook, plaat met contactstrip, uitvouwplaat). Gedeeld 5/6/2 door seed 57142600, scope surface, mode read; de gebruiker vergrendelde de leidende kaart.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

De metafoor is geen versiering: useRewrite roept de proxy per alinea aan, dus de alinea's kómen los van elkaar binnen. Latent is de echte wachtstaat, niet een geënsceneerde.

Route: één client-side pagina met ?slug=, zodat de preview geen 887 extra pagina's aan de export toevoegt. Bij het live zetten wordt dit weer /nieuws/[slug] met generateStaticParams.
