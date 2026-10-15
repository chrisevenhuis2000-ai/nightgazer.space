# Bronnen — NightGazer social v2

Elk beeld in deze video, met bron, licentie en credit. De originelen staan niet in git: `scripts/fetch-sources.sh` haalt ze op, `scripts/prep-textures.py` maakt er de render-texturen van (alleen herschalen, uitsnijden en lagen scheiden; er wordt niets bij verzonnen). De kleurbewerking (zilvergelatine-grade richting brand-blauw) gebeurt in de compositie.

## Echte opnames

### Aarde bij nacht — NASA Black Marble 2016
- **Gebruikt in:** openingsshot 0–1,6 s (Europa bij nacht, de Benelux in beeld).
- **Bestanden:** `BlackMarble_2016_3km.jpg` (13500 × 6750, wereld) en de 500 m-tegels `BlackMarble_2016_B1.jpg` en `BlackMarble_2016_C1.jpg` (elk 21600 × 21600). Daaruit: een wereldtextuur van 8192 × 4096 en een Europa-patch (30° W–45° O, 30°–75° N) van 8192 × 4915.
- **Download:** `https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/`
- **Bronpagina's (gecontroleerd op science.nasa.gov):** de oude recordpagina `https://earthobservatory.nasa.gov/images/144898/earth-at-night-2016` stuurt nu alleen door naar de algemene Earth Observatory-startpagina. De kaarten staan op https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/. De credit komt uit het bijbehorende artikel https://science.nasa.gov/earth/earth-observatory/night-light-maps-open-up-new-applications-90008/.
- **Credit (letterlijk):** "NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Román, NASA GSFC."
- **Licentie: niet bevestigd.** De NASA Images and Media Usage Guidelines staan op `www.nasa.gov/nasa-brand-center/`. Dat domein is vanuit de bouwomgeving geblokkeerd, en `science.nasa.gov/image-use-policy/` gaf een 403 met een browsercheck. Ook het API-document van images.nasa.gov bevat geen licentietekst. Er is **geen aanwijzing gevonden dat het beeld géén public domain is**, maar dat het wél public domain is, heb ik ook niet zelf gelezen. Laat dit nakijken voordat de video publiek gaat.
- **Credit in de video:** "Aarde: NASA Earth Observatory" (op de plaat vanaf 4,6 s; de aarde zelf staat dan niet meer in beeld). De volledige credit staat hierboven en hoort in de postbeschrijving.

### Phantom Galaxy (M74) — ESA/Webb potm2208b, "The Phantom Galaxy Across the Spectrum"
- **Gebruikt in:** 4,2–10 s (2.5D-parallax met drie dieptelagen, daarna de plaat op de lichtbak).
- **Bronpagina:** https://esawebb.org/images/potm2208b/ (gecontroleerd)
- **Bestand:** Large JPEG, `https://cdn.esawebb.org/archives/images/large/potm2208b.jpg` (5047 × 3136, volle resolutie).
- **Licentie:** Creative Commons Attribution 4.0 International (CC BY 4.0), volgens https://esawebb.org/copyright/ (gecontroleerd). De pagina zegt dat de volledige credit **zichtbaar** vermeld moet worden. Logo's van ESA/Webb mogen niet worden gebruikt, en het beeld mag geen goedkeuring van ESA/Webb suggereren. Beide zijn in de video gerespecteerd: er staan geen agency-logo's in beeld.
- **Credit (letterlijk van de bronpagina):** "ESA/Webb, NASA & CSA, J. Lee and the PHANGS-JWST Team; ESA/Hubble & NASA, R. Chandar"
- **Credit in de video:** in beeld vanaf 4,6 s tot het einde.
- **Feit in beeld:** "±32 mln lichtjaar · Vissen", uit de tekst op ESA/Webb potm2208a ("around 32 million light-years away from Earth in the constellation Pisces").
- **Let op:** het ID `weic2207a` uit de opdracht is niet de Phantom Galaxy. Volgens esawebb.org is dat de Southern Ring Nebula (NIRCam/MIRI-collage). De Phantom Galaxy staat op esawebb.org onder potm2208a/b/c.

## Vormgeving (geen waarneming)
- **De reuzenplaneet** (1,6–5,6 s) is **procedureel** (Three.js-shader met vaste seed): banden, terminator en atmosfeerrand zijn vormgeving. Het is geen echte planeet en wordt in beeld ook niet als waarneming gepresenteerd: er staat geen naam of meetwaarde bij.
- **Sterrenvelden** voor parallax: procedureel, met vaste seed.
- **Emulsiegrain:** procedureel, met per frame een vaste seed.
- **"Jouw dak · voorbeeld" 52,1° N 5,2° O:** illustratieve waarde, gelabeld als voorbeeld. Het kruisje wijst Utrecht aan op de Black Marble.

## Geluid
- **Volledig gesynthetiseerd** met `scripts/sound.py` (numpy/scipy, vaste seeds). Er zijn geen samples van internet gebruikt, geen AI-muziekmodellen en ook geen NASA-sonificaties. Zie `AUDIO.md`.

## Software en fonts
- three.js r181 (MIT), lokaal in `assets/vendor/` (licentie: `assets/vendor/three-LICENSE.txt`).
- GSAP 3.14.2 (gratis licentie van GSAP), lokaal in `assets/vendor/`.
- Archivo en JetBrains Mono (SIL Open Font License), lokaal in `assets/fonts/`.
- Het logo `assets/brand/logo-transparent.png` is ongewijzigd en op native 500 × 100 geplaatst.
