'use client'

/* Agenda-blokje voor /vandaag en de voorpagina.

   Was "Zet meldingen aan". Push haalde 0 abonnees: op de iPhone moet de site
   eerst op het beginscherm, en in de browser van Instagram werkt het niet.
   Een gewone link naar een .ics-bestand werkt op elke telefoon: de agenda
   opent en zet de komende meteorenzwermen erin, met een herinnering de dag
   ervoor. Het bestand maakt scripts/generate-agenda.mjs bij de build.
   Push blijft bestaan op /sterrenkijken, voor wie dat wil. */
import Link from 'next/link'
import { telGebeurtenis } from '@/lib/tel'

const waar = () => (typeof location !== 'undefined' ? location.pathname : '')

export function MeldingenTeaser({ tekst }: { tekst?: string }) {
  return (
    <div className="pl-plate pl-steun">
      <div className="pl-steun__t">
        <h2 className="pl-h3">Mis geen vallende sterren</h2>
        <p className="pl-body-s">
          {tekst ?? 'Zet de komende meteorenzwermen in je agenda, met een herinnering de dag ervoor. Werkt op elke telefoon, zonder account. '}
          Liever een melding bij noorderlicht of de ISS?{' '}
          <Link href="/sterrenkijken/#pl-meld" className="pl-voorw__a" onClick={() => telGebeurtenis('push-teaser', waar())}>Zet meldingen aan</Link>.
        </p>
      </div>
      <a
        href="/agenda/meteorenzwermen.ics"
        className="pl-btn pl-btn--act"
        onClick={() => telGebeurtenis('agenda-teaser', waar())}
      >
        Zet het in je agenda
      </a>
    </div>
  )
}
