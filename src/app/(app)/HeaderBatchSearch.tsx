'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui'
import { searchBatchesByNumber, type BatchSearchResult } from '@/server/batches/search'

const DEBOUNCE_MS = 250

export function HeaderBatchSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BatchSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (!trimmed) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const found = await searchBatchesByNumber(trimmed)
        setResults(found)
        setOpen(true)
      })
    }, DEBOUNCE_MS)
  }

  function handleSelect(id: string) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/batches/${id}`)
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <Input
        type="search"
        placeholder="Search batch number…"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="w-40 lg:w-56"
        aria-label="Search batch number"
      />
      {open && (
        <ul className="absolute top-full right-0 z-50 mt-1 max-h-64 w-72 overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          {isPending ? (
            <li className="px-3 py-2 text-sm text-text-muted">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">No matching batches.</li>
          ) : (
            results.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(b.id)}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-hover"
                >
                  <span className="font-medium text-text">{b.batchNumber}</span>
                  <span className="truncate text-xs text-text-muted">{b.productName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
