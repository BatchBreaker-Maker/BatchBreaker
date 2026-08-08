interface LogoProps {
  collapsed?: boolean
  className?: string
}

export function Logo({ collapsed = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      {!collapsed && <span className="text-base font-semibold text-nowrap text-text">Batch Breaker</span>}
    </div>
  )
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Batch Breaker">
      <path d="M10 6 L25 6 L31 12 L31 34 L10 34 Z" fill="#F5F5F5" />
      <path d="M25 6 L31 12 L25 12 Z" fill="#2A2A2A" />
      <rect x="13" y="27" width="10" height="1.5" fill="#9A9A9A" />
      <rect x="13" y="30.5" width="7" height="1.5" fill="#9A9A9A" />
      <g transform="translate(8,9) scale(1.35)">
        <path
          d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
          fill="#E6B800"
          stroke="#0D0D0D"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
