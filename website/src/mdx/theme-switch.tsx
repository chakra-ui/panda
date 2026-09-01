'use client'

import { MoonIcon, SunIcon } from '@/icons'
import { Select } from '@/mdx/select'
import { css } from '@/styled-system/css'
import { useTheme } from 'next-themes'

interface ThemeSwitchProps {
  className?: string
}

const sunIcon = css({ _dark: { display: 'none' } })
const moonIcon = css({ display: 'none', _dark: { display: 'block' } })

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { setTheme, theme = '' } = useTheme()

  return (
    <Select
      className={className}
      title="Change theme"
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' }
      ]}
      onChange={option => {
        if (!option) return
        setTheme(option.value)
      }}
      selected={{
        value: theme,
        label: (
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              textTransform: 'capitalize'
            })}
          >
            <SunIcon className={sunIcon} />
            <MoonIcon className={moonIcon} />
          </div>
        )
      }}
    />
  )
}