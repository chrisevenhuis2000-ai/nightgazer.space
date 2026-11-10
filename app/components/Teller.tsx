'use client'

/* Telt elke paginaweergave, ook bij navigatie binnen de site,
   en elke klik naar een winkel of Ko-fi. Zie lib/tel.ts. */
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { telWeergave, telUitklikken } from '@/lib/tel'

export default function Teller() {
  const pad = usePathname()
  useEffect(() => { telWeergave() }, [pad])
  useEffect(() => { telUitklikken() }, [])
  return null
}
