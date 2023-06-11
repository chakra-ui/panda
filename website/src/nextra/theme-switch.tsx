import { css } from '@/styled-system/css'
import { useTheme } from 'next-themes'
import { useMounted } from 'nextra/hooks'
import { MoonIcon, SunIcon } from 'nextra/icons'
import { z } from 'zod'
import { useConfig } from './contexts'
import { Select } from './select'

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

export function ThemeSwitch({ lite, className }: ThemeSwitchProps) {
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
