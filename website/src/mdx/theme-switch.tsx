import { MoonIcon, SunIcon } from '@/icons'
import { useMounted } from '@/lib/use-mounted'
import { Select } from '@/mdx/select'
import { css } from '@/styled-system/css'
import { useTheme } from 'next-themes'

interface ThemeSwitchProps {
  className?: string
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { setTheme, resolvedTheme, theme = '' } = useTheme()
  const mounted = useMounted()

  const IconToUse = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon

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
              gap: 2,
              textTransform: 'capitalize'
            })}
          >
            <IconToUse />
          </div>
        )
      }}
    />
  )
}
