'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IMPLEMENTED_SECTIONS, SECTION_TITLES, sectionHref } from '@/lib/workflow/sections'
import { buttonClassName } from '@/components/ui'

interface SectionNavFooterProps {
  batchId: string
  accessibleSections: number[]
}

// Mirrors the sidebar's prev/next row, but rendered at the bottom of the
// section content itself — after scrolling through a long form (an
// open-ended log, say), the sidebar's nav row is off-screen, so this gives
// users a way to move on without scrolling back up.
export function SectionNavFooter({ batchId, accessibleSections }: SectionNavFooterProps) {
  const pathname = usePathname()
  const match = pathname.match(/\/sections\/(\d+)/)
  const currentSection = match ? Number(match[1]) : pathname === `/batches/${batchId}` ? 1 : null
  if (currentSection == null) return null

  const accessibleSet = new Set(accessibleSections)
  const accessibleList = IMPLEMENTED_SECTIONS.filter((n) => accessibleSet.has(n))
  const currentIndex = accessibleList.findIndex((n) => n === currentSection)
  if (currentIndex === -1) return null

  const prevSection = currentIndex > 0 ? accessibleList[currentIndex - 1] : null
  const nextSection = currentIndex < accessibleList.length - 1 ? accessibleList[currentIndex + 1] : null
  if (!prevSection && !nextSection) return null

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-6 sm:px-6 lg:px-8">
      {prevSection ? (
        <Link href={sectionHref(batchId, prevSection)} prefetch={false} className={buttonClassName('secondary')}>
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Previous <span className="hidden sm:inline">— {prevSection}. {SECTION_TITLES[prevSection]}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {nextSection ? (
        <Link href={sectionHref(batchId, nextSection)} prefetch={false} className={buttonClassName('secondary')}>
          <span className="truncate">
            Next <span className="hidden sm:inline">— {nextSection}. {SECTION_TITLES[nextSection]}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}
