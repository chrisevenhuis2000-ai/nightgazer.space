/* De Hemelbrief: wekelijkse mail via MailerLite (account van Crix, sinds
   12-11-2026). Het adres is het "action"-adres van het ingesloten formulier
   "Hemelbrief" in MailerLite; double opt-in staat daar aan. Verandert het
   formulier, zet dan hier het nieuwe adres. */
export const HEMELBRIEF_ACTIE = 'https://assets.mailerlite.com/jsonp/2791476/forms/203970523763311631/subscribe'
export const HEMELBRIEF_DAG = 'vrijdag'
export const HEMELBRIEF_EERSTE = 'vrijdag 27 november'

/** Wat er in elke brief staat: op /hemelbrief en in de bevestigingsmail. */
export const HEMELBRIEF_INHOUD = [
  { titel: 'Dit weekend aan de hemel', tekst: 'Eén ding dat je zaterdag of zondag met het blote oog ziet, met de tijd en de richting.' },
  { titel: 'Wanneer het donker is', tekst: 'Zonsondergang, echt donker en de maan, voor midden-Nederland. En of het weer meezit, zodra dat bekend is.' },
  { titel: 'Wat er speelt', tekst: 'Het nieuws van de week in een paar zinnen: een lancering, een missie of een foto die de moeite waard is.' },
  { titel: 'Voor wie verder wil', tekst: 'Een tip voor de verrekijker of telescoop, en een vraag om zelf over na te denken.' },
]
