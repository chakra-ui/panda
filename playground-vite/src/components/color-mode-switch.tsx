import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cx, css } from '../../styled-system/css'
import { button } from '../../styled-system/recipes'
import { Sun, Moon } from './icons'

export const ColorModeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const theme = useTheme()
  console.log(theme)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { setTheme, resolvedTheme } = theme

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    console.log(resolvedTheme)
    return setTheme(isDark ? 'light' : 'dark')
  }

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
        })
      )}
    >
      <IconToUse />
    </button>
  )
}
