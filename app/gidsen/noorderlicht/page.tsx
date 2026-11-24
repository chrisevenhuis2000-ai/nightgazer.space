import type { Metadata } from 'next'
import Link from 'next/link'
import TekstPlaat, { type TekstArtikel } from '@/app/_plate/TekstPlaat'
import { ogBeeld } from '@/lib/og'

/* Evergreen-gids: noorderlicht zien vanuit Nederland. De drempels (Kp 4 t/m
   8) volgen lib/aurora.ts, zodat deze gids en de live verwachting op
   /sterrenkijken hetzelfde zeggen. */

export const metadata: Metadata = {
  title:       'Noorderlicht zien in Nederland: wanneer, waar en hoe',
  description: 'Vanaf welke Kp-index je noorderlicht ziet vanuit Nederland, waar je het beste kijkt, hoe laat, en hoe je het met je telefoon fotografeert.',
  alternates:  { canonical: '/gidsen/noorderlicht/' },
  openGraph: {
    images:      ogBeeld('iss072e159172', 'Noorderlicht gezien vanaf het ISS, oktober 2024 · NASA'),
    title:       'Noorderlicht zien in Nederland: wanneer, waar en hoe',
    description: 'De Kp-index uitgelegd, de beste plekken en tijden, en foto’s maken met je telefoon.',
    url:         '/gidsen/noorderlicht/',
  },
}

const A = 'pl-voorw__a'

const ARTIKELEN: TekstArtikel[] = [
  {
    kop: 'Wat is noorderlicht?',
    tekst: <>
      <p>
        De zon blaast voortdurend geladen deeltjes de ruimte in. Bij een uitbarsting komt er
        ineens een flinke wolk van die deeltjes op de aarde af. Het magnetisch veld van de aarde
        leidt ze naar de polen, waar ze hoog in de atmosfeer op zuurstof en stikstof botsen.
        Die gassen gaan dan gloeien.
      </p>
      <p>
        Groen komt van zuurstof op zo’n 100 tot 250 km hoogte. Rood komt ook van zuurstof, maar
        nog hoger. Paars en blauw komen van stikstof. Omdat het licht zo hoog hangt, zie je het
        vanuit Nederland ook als de ovaal boven Scandinavië ligt: laag boven de noordelijke horizon.
      </p>
    </>,
  },
  {
    kop: 'De Kp-index: vanaf wanneer heeft kijken zin?',
    tekst: <>
      <p>
        De Kp-index loopt van 0 (rustig) tot 9 (zware storm) en zegt hoe onrustig het magnetisch
        veld van de aarde is. Hoe hoger, hoe verder de noorderlichtovaal naar het zuiden zakt.
        Voor Nederland geldt ruwweg:
      </p>
      <ul>
        <li><strong>Kp 4:</strong> grensgeval. Alleen een camera ziet misschien iets, op een donkere plek.</li>
        <li><strong>Kp 5:</strong> kleine kans op een groenige gloed laag in het noorden.</li>
        <li><strong>Kp 6:</strong> goede kans in het noorden van het land, met het blote oog.</li>
        <li><strong>Kp 7 en hoger:</strong> helder, hoog aan de hemel, en ook verder naar het zuiden.</li>
      </ul>
      <p>
        De actuele Kp en de verwachting voor de komende nachten staan live op{' '}
        <Link href="/sterrenkijken/" className={A}>Sterrenkijken</Link>. Je kunt daar ook een melding
        aanzetten, zodat je het niet mist.
      </p>
    </>,
  },
  {
    kop: 'Waar kijk je het beste?',
    tekst: <>
      <p>
        Twee dingen tellen: donker en vrij zicht op het noorden. Hoe noordelijker, hoe beter, maar
        een donkere plek in het midden van het land wint het van een verlichte stad in Groningen.
      </p>
      <p>
        Goede plekken zijn de Waddenkust, de Waddeneilanden, het Lauwersmeer en open polders zonder
        kassen of dorpen aan de noordkant. Zoek op de{' '}
        <Link href="/sterrenkijken/" className={A}>donkertekaart</Link> een plek bij jou in de buurt.
      </p>
    </>,
  },
  {
    kop: 'Wanneer en hoe laat?',
    tekst: <>
      <p>
        Noorderlicht kan het hele jaar, maar je hebt een donkere nacht nodig. In de zomer wordt het
        in Nederland nauwelijks echt donker, dus de beste maanden lopen van september tot en met maart.
        Rond maart en september komen stormen iets vaker voor.
      </p>
      <p>
        Kijk bij een verwachte storm vooral tussen 22:00 en 02:00. Een sterke storm kan ook eerder
        of later op de avond losbarsten, dus blijf een paar uur kijken. Een volle maan maakt zwak
        noorderlicht lastiger te zien, maar een sterke storm zie je er gewoon doorheen.
      </p>
      <p>
        De zon zit in de jaren rond het maximum van haar cyclus van ongeveer 11 jaar. Op 10 mei en
        10 oktober 2024 was het noorderlicht boven heel Nederland te zien. Zulke nachten blijven de
        komende jaren mogelijk.
      </p>
    </>,
  },
  {
    kop: 'Wat zie je met je eigen ogen?',
    tekst: <>
      <p>
        Verwacht bij een gewone storm geen groene gordijnen zoals op foto’s uit Noorwegen. Vaak zie
        je eerst een grijswitte boog of gloed boven de noordelijke horizon, die op een wolk lijkt.
        Het verschil: sterren schijnen er gewoon doorheen, en de gloed verandert langzaam van vorm.
      </p>
      <p>
        Je ogen zien in het donker weinig kleur. Geef ze een kwartier zonder telefoonscherm of
        lampen om te wennen. Bij Kp 7 of hoger zie je wel kleur, soms met pilaren die bewegen.
      </p>
    </>,
  },
  {
    kop: 'Noorderlicht fotograferen met je telefoon',
    tekst: <>
      <ul>
        <li>Zet de nachtmodus aan, of kies in de pro-stand een sluitertijd van 3 tot 10 seconden.</li>
        <li>Zet je telefoon stil: op een statiefje, een paaltje of tegen je tas.</li>
        <li>Zet de flitser uit en richt op het noorden, met een stukje horizon in beeld.</li>
        <li>Zie je niets met je ogen? Maak toch een foto. De camera vangt vaak al groen of rood als jij alleen grijs ziet.</li>
      </ul>
      <p>
        Met een systeemcamera werkt een groothoeklens met een open diafragma (f/2,8 of lager),
        ISO 1600 tot 3200 en 5 tot 15 seconden goed. Meer tips staan in de{' '}
        <Link href="/sterrenkijken/" className={A}>belichtingstabel</Link>.
      </p>
    </>,
  },
  {
    kop: 'Waarom de verwachting vaak niet klopt',
    tekst: <>
      <p>
        Een wolk deeltjes van de zon doet er 1 tot 3 dagen over om de aarde te bereiken. Of hij ons
        raakt, en wanneer precies, is pas op het laatste uur goed te zeggen. Het hangt ook af van
        de richting van het magnetisch veld in die wolk, en die meten satellieten pas vlak voor aankomst.
      </p>
      <p>
        Een voorspelde Kp 7 kan dus een Kp 4 worden, en omgekeerd. Zie de verwachting als een seintje
        om klaar te staan, niet als een belofte. Kijk op de avond zelf naar de gemeten waarde.
      </p>
    </>,
  },
]

export default function Page() {
  return (
    <TekstPlaat
      id="noorderlicht"
      current="gidsen"
      titel="Noorderlicht zien in Nederland"
      sub="Wanneer, waar en hoe je kijkt"
      intro={<p className="pl-body">
        Noorderlicht boven Nederland is zeldzaam, maar het gebeurt vaker dan je denkt. Met de
        Kp-index, een donkere plek en een telefooncamera vergroot je je kans flink.
      </p>}
      artikelen={ARTIKELEN}
    />
  )
}
