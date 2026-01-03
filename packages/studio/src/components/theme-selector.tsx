import React, { useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import { panda, Stack } from '../../styled-system/jsx'
import { availableThemes } from '../lib/panda-context'
import { currentThemeStore } from '../lib/theme-store'

const titleCase = (str: string) => str.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

export function ThemeSelector() {
  const currentTheme = useStore(currentThemeStore)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Only show theme selector when themes are defined in the configuration
  if (availableThemes.length === 0) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    currentThemeStore.set(value || undefined)
  }

  // Show a simple fallback until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <Stack gap="2">
        <panda.label fontWeight="bold" fontSize="small" opacity="0.7">
          THEME
        </panda.label>
        <panda.select
          px="3"
          py="2"
          borderRadius="md"
          borderWidth="1"
          borderColor="gray.200"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
          fontSize="sm"
          disabled
        >
          <option>Loading...</option>
        </panda.select>
      </Stack>
    )
  }

  return (
    <Stack gap="2">
      <panda.label fontWeight="bold" fontSize="small" opacity="0.7">
        THEME
      </panda.label>
      <panda.select
        id="theme-selector"
        px="3"
        py="2"
        borderRadius="md"
        borderWidth="1"
        borderColor="gray.200"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
        fontSize="sm"
        cursor="pointer"
        value={currentTheme || ''}
        onChange={handleChange}
      >
        <option value="">Default</option>
        {availableThemes.map((theme) => (
          <option key={theme} value={theme}>
            {titleCase(theme)}
          </option>
        ))}
      </panda.select>
    </Stack>
  )
}
