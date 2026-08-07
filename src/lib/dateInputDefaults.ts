'use client'

import { useSyncExternalStore } from 'react'

function nowForDateTimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function todayForDateInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const noopSubscribe = () => () => {}
const serverSnapshot = () => ''

// Computing "now" during the server render would bake in the server's
// clock/timezone instead of the user's. useSyncExternalStore is the React-
// sanctioned way to render a value that legitimately differs between server
// and client without a hydration-mismatch warning (getServerSnapshot governs
// the SSR/initial-hydration output, getSnapshot takes over after) — the
// field just briefly renders blank, then fills in from the browser's own
// clock. Still just a convenience default; every field using this stays
// fully editable.
export function useDefaultDateTimeLocal(): string {
  return useSyncExternalStore(noopSubscribe, nowForDateTimeLocal, serverSnapshot)
}

export function useDefaultDateInput(): string {
  return useSyncExternalStore(noopSubscribe, todayForDateInput, serverSnapshot)
}
