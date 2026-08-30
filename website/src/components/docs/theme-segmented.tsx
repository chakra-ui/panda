'use client'

import { Segmented } from '@/components/ui/segmented'
import { useTheme } from 'next-themes'

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

/**
 * Inline theme picker for the mobile sheet. A popover would position itself
 * outside the drawer, so the choice is laid out in place instead.
 */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme()

  return (
    <Segmented
      label="Colour theme"
      size="sm"
      tone="pill"
      value={theme ?? 'system'}
      onValueChange={setTheme}
      options={OPTIONS}
    />
  )
}
