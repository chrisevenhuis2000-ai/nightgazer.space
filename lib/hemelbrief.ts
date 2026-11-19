/* De Hemelbrief: wekelijkse mail via MailerLite (account van Crix, sinds
   12-11-2026). Het adres is het "action"-adres van het ingesloten formulier
   "Hemelbrief" in MailerLite; double opt-in staat daar aan. Verandert het
   formulier, zet dan hier het nieuwe adres. */
export const HEMELBRIEF_ACTIE = 'https://assets.mailerlite.com/jsonp/2791476/forms/203970523763311631/subscribe'
export const HEMELBRIEF_DAG = 'vrijdag'
export const HEMELBRIEF_EERSTE = 'vrijdag 27 november'

/** Wat er in elke brief staat: op /hemelbrief en in de bevestigingsmail.
 *  `voorbeeld` laat op /hemelbrief zien hoe dat onderdeel er in de eerste
 *  brief uitziet (weekend 28 en 29 november 2026, tijden voor Utrecht,
 *  uitgerekend met astronomy-engine). Wie een voorbeeld ziet, geeft eerder
 *  zijn adres (persona-rapport 19-11-2026). Vervang het na de eerste brief
 *  gerust door een stuk uit een echte. */
export const HEMELBRIEF_INHOUD = [
  {
    titel: 'Dit weekend aan de hemel',
    tekst: 'Eén ding dat je zaterdag of zondag met het blote oog ziet, met de tijd en de richting.',
    voorbeeld: 'Zaterdag tussen 19:00 en 20:30 staat de Andromedanevel bijna recht boven je hoofd. Zoek eerst de W van Cassiopeia, dan een vaag langwerpig vlekje eronder. Dat is een ander sterrenstelsel, 2,5 miljoen lichtjaar ver.',
  },
  {
    titel: 'Wanneer het donker is',
    tekst: 'Zonsondergang, echt donker en de maan, voor midden-Nederland. En of het weer meezit, zodra dat bekend is.',
    voorbeeld: 'Zaterdag gaat de zon om 16:33 onder en is het vanaf 18:36 echt donker. De maan komt pas om 20:46 op, dus de vroege avond is het donkerst. Zondag komt hij om 22:15 op.',
  },
  {
    titel: 'Wat er speelt',
    tekst: 'Het nieuws van de week in een paar zinnen: een lancering, een missie of een foto die de moeite waard is.',
    voorbeeld: 'NASA zoekt nieuwe astronauten voor de maan en later Mars. Aanmelden kan tot en met 3 december, maar alleen voor Amerikanen. Europa heeft met Luca Parmitano wel een plek in Artemis III.',
  },
  {
    titel: 'Voor wie verder wil',
    tekst: 'Een tip voor de verrekijker of telescoop, en een vraag om zelf over na te denken.',
    voorbeeld: 'Richt je verrekijker tussen Cassiopeia en Perseus: twee sterrenhopen naast elkaar in één beeld. En een vraag voor bij het kijken: waarom fonkelen sterren wel en planeten niet?',
  },
]
