/* De melding over commissie, gelijk op elke pagina met winkelknoppen. De
   laatste zin is de letterlijke tekst die het partnerprogramma van Amazon
   van deelnemers vraagt. */
export function AffiliateMelding() {
  return (
    <p className="pl-uhero__melding">
      <span className="pl-label pl-label--stamp">Over deze links</span>
      <span>
        Koop je iets via een knop op deze pagina, dan krijgt NightGazer een kleine
        commissie van de winkel. Jij betaalt niets extra. Als Amazon-partner verdien ik aan
        in aanmerking komende aankopen.
      </span>
    </p>
  )
}
