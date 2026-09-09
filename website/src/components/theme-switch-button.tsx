'use client'

import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'
import { ButtonIcon } from '@/theme/icons'
import { useTheme } from 'next-themes'

const switchStyle = css({
  px: '2',
  py: '1',
  textStyle: 'xl',
  fontWeight: 'semibold',
  letterSpacing: 'tight',
  rounded: 'md',
  cursor: 'pointer',
  _hover: { bg: 'bg.emphasized.hover' },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '2px'
  }
})

/**
 * Which face shows is decided by the theme class on `html`, not by React, so
 * the control is correct on first paint and needs no mount guard.
 */
const lightOnly = css({ display: 'contents', _dark: { display: 'none' } })
const darkOnly = css({ display: 'none', _dark: { display: 'contents' } })

function useToggleTheme() {
  const { setTheme, resolvedTheme } = useTheme()
  return () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
}

export function ThemeSwitchButton() {
  const toggleTheme = useToggleTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle colour theme"
      className={switchStyle}
    >
      <HStack gap="2">
        <span className={lightOnly}>
          <span>Light</span>
          <ButtonIcon icon="Sun" />
        </span>
        <span className={darkOnly}>
          <span>Dark</span>
          <ButtonIcon icon="Moon" />
        </span>
      </HStack>
    </button>
  )
}

export function ThemeSwitchIconButton() {
  const toggleTheme = useToggleTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle colour theme"
      className={switchStyle}
    >
      <span className={lightOnly}>
        <ButtonIcon icon="Sun" />
      </span>
      <span className={darkOnly}>
        <ButtonIcon icon="Moon" />
      </span>
    </button>
  )
}
