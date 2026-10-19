import { Moon, Sun } from '@/src/components/icons'
import { css, cx } from '@/styled-system/css'
import { button } from '@/styled-system/recipes'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export const ColorModeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { setTheme, resolvedTheme } = theme

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const IconToUse = isDark ? Sun : Moon

  return (
    <button
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      onClick={toggleTheme}
      className={cx(
        button(),
        css({
          borderRadius: 'sm',
          p: '2',
          '& svg': {
            width: '22px',
          },
        }),
      )}
    >
      <IconToUse />
    </button>
  )
}
