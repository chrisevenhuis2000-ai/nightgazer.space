export type MissionStatus = 'actief' | 'gepland' | 'voltooid' | 'mislukt'

/**
 * Wat er na een geslaagde lancering gebeurt. Een 'missie' heeft een
 * operationele fase en wordt 'actief'; een 'lancering' (constellatie-batch,
 * rideshare, geheime nuttige lading, testvlucht) is daarmee klaar en wordt
 * 'voltooid'. Handmatig veld: scripts/update-missions.js overschrijft het
 * nooit, en zet alleen een startwaarde bij nieuwe missies.
 */
export type MissionSoort = 'missie' | 'lancering'

export interface TimelineEntry {
  date:  string
  event: string
}

/**
 * Eén vlucht uit een testcampagne (alleen Starship draagt dit nu). Booster en
 * schip hebben elk hun eigen uitkomst: dat is wat een testreeks vertelt.
 * 'onbekend' betekent dat de uitkomst nog niet in de data staat, niet dat
 * de vlucht mislukte. Handmatig veld; het script raakt het niet aan.
 */
export type TrapUitkomst = 'gevangen' | 'zee' | 'verloren' | 'onbekend'

export interface CampagneVlucht {
  vlucht:  string
  /** ISO-datum (yyyy-mm-dd) */
  datum:   string
  versie:  string
  booster: TrapUitkomst
  schip:   TrapUitkomst
  noot:    string
  /** id van de eigen missiepagina, als die bestaat */
  missie?: string
  /** pad naar het artikel waar de noot op steunt */
  bron?:   string
}

export interface MissionDetail {
  id:          string
  name:        string
  agency:      string
  agencyColor: string
  status:      MissionStatus
  soort:       MissionSoort
  launched:    string
  /**
   * Hoe hard de lanceerdatum is, rechtstreeks uit Launch Library 2
   * ('Minute', 'Hour', 'Day', 'Month', 'Quarter', 'Year', ...). Ontbreekt op
   * oudere records; dan valt mission-schedule terug op een heuristiek.
   */
  launchPrecision?: string
  objective:   string
  body:        string
  highlight:   string
  icon:        string
  bgFrom:      string
  bgTo:        string
  // Detail-only fields
  description:  string
  vehicle:      string
  launchSite:   string
  duration:     string
  distanceKm:   string
  missionUrl:   string
  timeline:     TimelineEntry[]
  facts:        { label: string; value: string }[]
  relatedTags:  string[]
  campagne?:    CampagneVlucht[]
}

// MISSIONS en MISSIONS_LAST_UPDATED worden gegenereerd door scripts/generate-missions-module.js
// vanuit content/missions.json — zie dat bestand voor handmatige aanpassingen.
import { MISSIONS, MISSIONS_LAST_UPDATED } from './missions-generated'
export { MISSIONS, MISSIONS_LAST_UPDATED }

export function getMissionBySlug(slug: string): MissionDetail | undefined {
  return MISSIONS.find(m => m.id === slug)
}
