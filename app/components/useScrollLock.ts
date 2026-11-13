import { useEffect } from 'react'

/* While a menu is open the page behind it stays put. The lock sits on <body>,
   not <html>: body already has overflow-x: hidden, and a hidden <html> would
   stop that from passing to the viewport, turn <body> into its own scroller
   and break the sticky header. iOS Safari 16+ honours this lock. */
export function useScrollLock(on: boolean) {
  useEffect(() => {
    if (!on) return
    const body = document.body
    const prev = body.style.overflow
    body.style.overflow = 'hidden'
    return () => { body.style.overflow = prev }
  }, [on])
}
