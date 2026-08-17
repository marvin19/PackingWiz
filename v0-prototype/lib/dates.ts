const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

import type { Traveler } from "./types"

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

// Age in whole years from an ISO birth date, or null if not provided.
export function ageFromBirthDate(iso?: string | null): number | null {
  if (!iso) return null
  const b = parseDate(iso)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return Math.max(0, age)
}

// Prefer a live age derived from birth date, falling back to a stored age.
export function resolveTravelerAge(t: Traveler): number | null {
  if (t.birthDate) return ageFromBirthDate(t.birthDate)
  return t.age ?? null
}

// Short label for a traveler's age, e.g. "7 yrs" or "8 mos" for babies.
export function formatAge(t: Traveler): string {
  if (t.birthDate) {
    const b = parseDate(t.birthDate)
    const now = new Date()
    let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
    if (now.getDate() < b.getDate()) months--
    months = Math.max(0, months)
    if (months < 24) return `${months} mo`
    return `${Math.floor(months / 12)} yrs`
  }
  return t.age != null ? `${t.age} yrs` : ""
}

export function durationDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0
  const start = parseDate(startIso)
  const end = parseDate(endIso)
  const ms = end.getTime() - start.getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)) + 1)
}

export function formatRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return "Add dates"
  const start = parseDate(startIso)
  const end = parseDate(endIso)
  const startStr = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}`
  const sameMonth = start.getMonth() === end.getMonth()
  const endStr = sameMonth
    ? `${end.getDate()}`
    : `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`
  return `${startStr}–${endStr}`
}

export function formatFull(iso: string): string {
  if (!iso) return "—"
  const d = parseDate(iso)
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
