'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IMPLEMENTED_SECTIONS, SECTION_TITLES } from '@/lib/workflow/sections'

export function BatchSidebar({ batchId, accessibleSections }: { batchId: string; accessibleSections: number[] }) {
  const pathname = usePathname()
  const match = pathname.match(/\/sections\/(\d+)/)
  const currentSection = match ? Number(match[1]) : null
  const accessibleSet = new Set(accessibleSections)

  const accessibleList = IMPLEMENTED_SECTIONS.filter((n) => accessibleSet.has(n))
  const currentIndex = currentSection != null ? accessibleList.findIndex((n) => n === currentSection) : -1
  const prevSection = currentIndex > 0 ? accessibleList[currentIndex - 1] : null
  const nextSection = currentIndex >= 0 && currentIndex < accessibleList.length - 1 ? accessibleList[currentIndex + 1] : null

  return (
    <nav className="flex w-60 shrink-0 flex-col gap-0.5 border-r border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <Link href={`/batches/${batchId}`} prefetch={false} className="mb-3 font-medium hover:underline">
        ← Batch overview
      </Link>
      {IMPLEMENTED_SECTIONS.map((n) => {
        const accessible = accessibleSet.has(n)
        const active = n === currentSection
        if (!accessible) {
          return (
            <span key={n} className="rounded px-2 py-1 text-zinc-400 dark:text-zinc-600" aria-disabled="true">
              {n}. {SECTION_TITLES[n]}
            </span>
          )
        }
        return (
          <Link
            key={n}
            href={`/batches/${batchId}/sections/${n}`}
            prefetch={false}
            className={`rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
              active ? 'bg-zinc-100 font-medium dark:bg-zinc-900' : ''
            }`}
          >
            {n}. {SECTION_TITLES[n]}
          </Link>
        )
      })}

      {currentSection != null && (prevSection || nextSection) && (
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {prevSection ? (
            <Link href={`/batches/${batchId}/sections/${prevSection}`} prefetch={false} className="text-xs hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {nextSection ? (
            <Link href={`/batches/${batchId}/sections/${nextSection}`} prefetch={false} className="text-xs hover:underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </nav>
  )
}
