'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Lock, Menu, X } from 'lucide-react'
import { IMPLEMENTED_SECTIONS, SECTION_TITLES } from '@/lib/workflow/sections'
import type { SectionDisplayStatus } from '@/lib/workflow/batchProgress'
import { NeedsInputFlag, StatusDot } from '@/components/ui/Badge'

interface BatchSidebarProps {
  batchId: string
  accessibleSections: number[]
  sectionDisplayStatuses: Record<number, SectionDisplayStatus>
  sectionNeedsInput: Record<number, boolean>
}

// Tiny external store so the persisted collapse preference can be read
// without a hydration mismatch (server always renders expanded) and without
// the set-state-in-effect anti-pattern for a plain "read once on mount".
const COLLAPSE_STORAGE_KEY = 'bb-sidebar-collapsed'
const collapseListeners = new Set<() => void>()
function subscribeCollapsed(callback: () => void) {
  collapseListeners.add(callback)
  return () => collapseListeners.delete(callback)
}
function getCollapsedSnapshot() {
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true'
}
function getCollapsedServerSnapshot() {
  return false
}
function setCollapsedPreference(value: boolean) {
  localStorage.setItem(COLLAPSE_STORAGE_KEY, String(value))
  collapseListeners.forEach((listener) => listener())
}

export function BatchSidebar({ batchId, accessibleSections, sectionDisplayStatuses, sectionNeedsInput }: BatchSidebarProps) {
  const pathname = usePathname()
  const match = pathname.match(/\/sections\/(\d+)/)
  const currentSection = match ? Number(match[1]) : null
  const accessibleSet = new Set(accessibleSections)

  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsedSnapshot, getCollapsedServerSnapshot)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer on navigation — adjusting state during render
  // (React's documented pattern for "reset state when a derived value
  // changes") rather than an effect, since we're reacting to a route change,
  // not synchronizing with an external system.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMobileOpen(false)
  }

  function toggleCollapsed() {
    setCollapsedPreference(!collapsed)
  }

  const accessibleList = IMPLEMENTED_SECTIONS.filter((n) => accessibleSet.has(n))
  const currentIndex = currentSection != null ? accessibleList.findIndex((n) => n === currentSection) : -1
  const prevSection = currentIndex > 0 ? accessibleList[currentIndex - 1] : null
  const nextSection = currentIndex >= 0 && currentIndex < accessibleList.length - 1 ? accessibleList[currentIndex + 1] : null

  function sectionList(forceExpanded: boolean) {
    const showLabels = forceExpanded || !collapsed
    return (
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {IMPLEMENTED_SECTIONS.map((n) => {
          const accessible = accessibleSet.has(n)
          const active = n === currentSection
          const status = sectionDisplayStatuses[n] ?? 'neutral'
          if (!accessible) {
            return (
              <span
                key={n}
                aria-disabled="true"
                title="You do not have access to this section"
                className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-text-muted/50"
              >
                <Lock className="h-3.5 w-3.5 shrink-0" />
                {showLabels ? <span className="truncate">{n}. {SECTION_TITLES[n]}</span> : <span>{n}</span>}
              </span>
            )
          }
          return (
            <Link
              key={n}
              href={`/batches/${batchId}/sections/${n}`}
              prefetch={false}
              title={showLabels ? undefined : `${n}. ${SECTION_TITLES[n]}`}
              className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                active
                  ? 'border-accent/40 bg-accent/10 font-medium text-text'
                  : 'border-transparent text-text-muted hover:border-border hover:bg-surface-hover hover:text-text'
              }`}
            >
              <StatusDot status={status} />
              {showLabels ? (
                <span className="min-w-0 flex-1 truncate">
                  {n}. {SECTION_TITLES[n]}
                </span>
              ) : (
                <span>{n}</span>
              )}
              {sectionNeedsInput[n] && <NeedsInputFlag className="ml-auto" />}
            </Link>
          )
        })}
      </nav>
    )
  }

  const prevNextRow = currentSection != null && (prevSection || nextSection) && (
    <div className="flex items-center justify-between border-t border-border p-3 text-xs">
      {prevSection ? (
        <Link
          href={`/batches/${batchId}/sections/${prevSection}`}
          prefetch={false}
          className="flex min-h-11 items-center gap-1 rounded-md px-2 text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Link>
      ) : (
        <span />
      )}
      {nextSection ? (
        <Link
          href={`/batches/${batchId}/sections/${nextSection}`}
          prefetch={false}
          className="flex min-h-11 items-center gap-1 rounded-md px-2 text-text-muted hover:text-text"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  )

  const pdfHref = `/batches/${batchId}/pdf`

  return (
    <>
      {/* Mobile: slim trigger bar, replaces the permanent sidebar below md */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-text"
        >
          <Menu className="h-5 w-5" />
          {currentSection ? `${currentSection}. ${SECTION_TITLES[currentSection]}` : 'Batch sections'}
        </button>
        <a
          href={pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Export PDF"
          className="flex min-h-11 min-w-11 items-center justify-center text-text-muted hover:text-text"
        >
          <FileDown className="h-5 w-5" />
        </a>
      </div>

      {/* Mobile: slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-3">
              <Link
                href={`/batches/${batchId}`}
                prefetch={false}
                className="text-sm font-medium text-text hover:underline"
              >
                ← Batch overview
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="flex min-h-11 min-w-11 items-center justify-center text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sectionList(true)}
            {prevNextRow}
            <div className="border-t border-border p-3">
              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border text-center text-xs font-medium text-text hover:bg-surface-hover"
              >
                <FileDown className="h-4 w-4" /> Export PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: permanent sidebar, collapsible to an icon rail */}
      <nav
        className={`hidden shrink-0 flex-col border-r border-border bg-surface md:flex ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <Link
            href={`/batches/${batchId}`}
            prefetch={false}
            title="Batch overview"
            className="min-w-0 truncate text-sm font-medium text-text hover:underline"
          >
            {collapsed ? '←' : '← Batch overview'}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
        {sectionList(false)}
        {prevNextRow}
        <div className="border-t border-border p-3">
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Export PDF"
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border text-center text-xs font-medium text-text hover:bg-surface-hover"
          >
            <FileDown className="h-4 w-4" /> {!collapsed && 'Export PDF'}
          </a>
        </div>
      </nav>
    </>
  )
}
