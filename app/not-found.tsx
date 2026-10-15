import Link from 'next/link'

// Opmaak in app/globals.css (.fout-*): Tailwind 4 genereert in dit project
// geen utility-klassen.
export default function NotFound() {
  return (
    <div className="fout-scherm"
         style={{ background: 'radial-gradient(ellipse at 50% 20%, #1a1c4a 0%, #0a0b1a 70%)' }}>

      {/* Star field decoration */}
      <div className="fout-sterren" aria-hidden>
        {[...Array(40)].map((_, i) => (
          <div key={i} className="fout-ster"
               style={{
                 width:  `${1 + Math.random() * 2}px`,
                 height: `${1 + Math.random() * 2}px`,
                 top:    `${Math.random() * 100}%`,
                 left:   `${Math.random() * 100}%`,
                 opacity: 0.15 + Math.random() * 0.4,
               }} />
        ))}
      </div>

      <div className="fout-inhoud">
        <p className="fout-kicker">
          Fout 404
        </p>

        <h1 className="fout-titel" style={{ fontSize: '3rem' }}>
          Verloren in de ruimte
        </h1>

        <p className="fout-tekst" style={{ color: '#8A9CC0' }}>
          Deze pagina lijkt niet te bestaan — misschien is hij opgeslokt door een zwart gat.
          Ga terug naar de homepage of bekijk het laatste nieuws.
        </p>

        <div className="fout-acties">
          <Link href="/"
                className="fout-knop"
                style={{ background: '#252858', border: '1px solid #3a3f7a', color: '#c8d4f0' }}>
            Naar de homepage
          </Link>
          <Link href="/nieuws"
                className="fout-knop"
                style={{ background: 'transparent', border: '1px solid #252858', color: '#8A9CC0' }}>
            Laatste nieuws
          </Link>
        </div>
      </div>
    </div>
  )
}
