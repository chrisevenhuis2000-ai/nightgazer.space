'use client'

/* Bewaar-knop in de kop. Een site mag zichzelf niet meer aan de bladwijzers
   toevoegen (window.external.AddFavorite en window.sidebar zijn uit alle
   moderne browsers verdwenen). Daarom wijst deze knop de bezoeker op de
   juiste route voor het eigen toestel:
   - desktop: de sneltoets, Cmd+D op een Mac, anders Ctrl+D;
   - Android/Chrome: de echte installatieprompt, als de browser die aanbiedt;
   - iPhone/iPad: Deel, dan "Zet op beginscherm" (Safari heeft geen prompt).
   Wie de site al als app geopend heeft, ziet de knop niet. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Ico } from './Instruments'

type Mode = 'mac' | 'pc' | 'ios' | 'android'

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detect(): Mode | null {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (standalone) return null

  const ua = navigator.userAgent
  // iPadOS meldt zich als Macintosh; het aanraakscherm verraadt hem.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return /Mac/.test(navigator.platform || ua) ? 'mac' : 'pc'
}

export function Bewaar() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    setMode(detect())
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt) }
    const onInstalled = () => { setPrompt(null); setMode(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      // De bezoeker gebruikt de sneltoets: de browser neemt het over.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') close()
    }
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, close])

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    setPrompt(null)
    if (outcome === 'accepted') close()
  }

  if (!mode) return null

  const mobile = mode === 'ios' || mode === 'android'
  const title = mobile ? 'Zet op beginscherm' : 'Bewaar als bladwijzer'

  return (
    <div className="pl-keep" ref={wrap}>
      <button
        type="button"
        className="pl-keep__btn"
        aria-expanded={open}
        aria-controls="pl-keep-pop"
        aria-label={`${title}: NightGazer bewaren`}
        title={title}
        onClick={() => setOpen(o => !o)}
      >
        <Ico.bookmark size={16} />
      </button>

      {open && (
        <div id="pl-keep-pop" className="pl-keep__pop" role="dialog" aria-label={title}>
          <div className="pl-keep__head">
            <span className="pl-label">{title}</span>
            <button type="button" className="pl-keep__x" aria-label="Sluiten" onClick={close}>
              <Ico.close size={14} />
            </button>
          </div>

          {(mode === 'mac' || mode === 'pc') && (
            <>
              <p className="pl-keep__keys" aria-label={mode === 'mac' ? 'Command plus D' : 'Control plus D'}>
                <kbd>{mode === 'mac' ? '⌘' : 'Ctrl'}</kbd>
                <span aria-hidden="true">+</span>
                <kbd>D</kbd>
              </p>
              <p>Druk deze toetsen in om NightGazer aan je bladwijzers toe te voegen.</p>
            </>
          )}

          {mode === 'ios' && (
            <p>
              Tik op <span className="pl-keep__ico"><Ico.share size={15} /> Deel</span> in
              Safari en kies <b>Zet op beginscherm</b>. Dan staat NightGazer als app
              tussen je andere apps.
            </p>
          )}

          {mode === 'android' && !prompt && (
            <p>
              Open het browsermenu <b aria-label="drie puntjes">⋮</b> en kies <b>Toevoegen
              aan startscherm</b>. Dan staat NightGazer als app tussen je andere apps.
            </p>
          )}

          {prompt && (
            <>
              {mobile
                ? <p>Zet NightGazer als app op je beginscherm, met één tik.</p>
                : <p className="pl-keep__alt">Of installeer NightGazer als app op je computer.</p>}
              <button type="button" className="pl-btn pl-keep__go" onClick={install}>
                {mobile ? 'Zet op beginscherm' : 'Installeer als app'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
