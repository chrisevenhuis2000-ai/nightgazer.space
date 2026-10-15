# Bronnen — NightGazer social v2

Elk beeld in deze video, met bron, licentie en credit. De originelen staan niet in git: `scripts/fetch-sources.sh` haalt ze op, `scripts/prep-textures.py` maakt er de render-texturen van (alleen herschalen, uitsnijden en lagen scheiden; er wordt niets bij verzonnen). De kleurbewerking (zilvergelatine-grade richting brand-blauw) gebeurt in de compositie.

## Echte opnames

### Aarde bij nacht — NASA Black Marble 2016
- **Gebruikt in:** openingsshot 0–1,6 s (Europa bij nacht, de Benelux in beeld).
- **Bestanden:** `BlackMarble_2016_3km.jpg` (13500 × 6750, wereld) en de 500 m-tegels `BlackMarble_2016_B1.jpg` en `BlackMarble_2016_C1.jpg` (elk 21600 × 21600). Daaruit: een wereldtextuur van 8192 × 4096 en een Europa-patch (30° W–45° O, 30°–75° N) van 8192 × 4915.
- **Download:** `https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/`
- **Bronpagina:** `https://earthobservatory.nasa.gov/images/144898/earth-at-night-2016`. Die stuurt door naar `science.nasa.gov`, en dat domein was vanuit de bouwomgeving **geblokkeerd**. De licentie is daarom **niet op de bronpagina gecontroleerd**.
- **Verwachte licentie:** NASA-beeld, public domain volgens de NASA Images and Media Usage Guidelines. Nog te bevestigen op de bronpagina.
- **Credit in de video:** "Aarde: NASA Earth Observatory". De volledige credit van de recordpagina moet nog worden overgenomen zodra die bereikbaar is.

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

## Software en fonts
- three.js r181 (MIT), lokaal in `assets/vendor/` (licentie: `assets/vendor/three-LICENSE.txt`).
- GSAP 3.14.2 (gratis licentie van GSAP), lokaal in `assets/vendor/`.
- Archivo en JetBrains Mono (SIL Open Font License), lokaal in `assets/fonts/`.
- Het logo `assets/brand/logo-transparent.png` is ongewijzigd en op native 500 × 100 geplaatst.
