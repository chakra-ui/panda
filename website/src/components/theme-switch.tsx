import type { ReactElement } from 'react'

import { SunIcon, MoonIcon } from 'nextra/icons'
import { useMounted } from 'nextra/hooks'
import { useTheme } from 'next-themes'

import { Select } from './select'
import { useConfig } from '../contexts'
import { z } from 'zod'
import { css } from '../../styled-system/css'

type ThemeSwitchProps = {
  lite?: boolean
  className?: string
}

export const themeOptionsSchema = z.strictObject({
  light: z.string(),
  dark: z.string(),
  system: z.string()
})

type ThemeOptions = z.infer<typeof themeOptionsSchema>

export function ThemeSwitch({
  lite,
  className
}: ThemeSwitchProps): ReactElement {
  const { setTheme, resolvedTheme, theme = '' } = useTheme()
  const mounted = useMounted()
  const config = useConfig().themeSwitch

  const IconToUse = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon
  const options: ThemeOptions =
    typeof config.useOptions === 'function'
      ? config.useOptions()
      : config.useOptions

  return (
    <Select
      className={className}
      title="Change theme"
      options={[
        { value: 'light', label: options.light },
        { value: 'dark', label: options.dark },
        { value: 'system', label: options.system }
      ]}
      onChange={option => {
        setTheme(option.value)
      }}
      selected={{
        value: theme,
        label: (
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textTransform: 'capitalize'
            })}
          >
            <IconToUse />
            <span className={lite ? css({ display: 'none' }) : ''}>
              {mounted ? options[theme as keyof typeof options] : options.light}
            </span>
          </div>
        )
      }}
    />
  )
}
