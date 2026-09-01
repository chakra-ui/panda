'use client'

import { Segmented } from '@/components/ui/segmented'
import { Box } from '@/styled-system/jsx'
import { useTheme } from 'next-themes'
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: <LuSun size={15} /> },
  { value: 'dark', label: 'Dark', icon: <LuMoon size={15} /> },
  { value: 'system', label: 'System', icon: <LuMonitor size={15} /> }
]

/**
 * Inline theme picker for the mobile sheet. A popover would position itself
 * outside the drawer, so the choice is laid out in place instead.
 */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme()

  return (
    <Box alignSelf="flex-start">
      <Segmented
        label="Colour theme"
        size="sm"
        tone="pill"
        value={theme ?? 'system'}
        onValueChange={setTheme}
        options={OPTIONS}
      />
    </Box>
  )
}
