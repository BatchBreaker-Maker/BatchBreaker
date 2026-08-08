import { type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-hover',
  destructive: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
  ghost: 'text-text-muted hover:bg-surface hover:text-text',
}

// Exposed so a styled-as-button <Link> (an <a>) can reuse the exact same
// classes without nesting a real <button> inside an <a>, which is invalid
// HTML and breaks keyboard/screen-reader navigation.
export function buttonClassName(variant: ButtonVariant = 'primary', className = '') {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />
}
