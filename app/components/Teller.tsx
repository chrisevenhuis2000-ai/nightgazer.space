'use client'

/* Telt elke paginaweergave, ook bij navigatie binnen de site. Zie lib/tel.ts. */
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { telWeergave } from '@/lib/tel'

export default function Teller() {
  const pad = usePathname()
  useEffect(() => { telWeergave() }, [pad])
  return null
}
