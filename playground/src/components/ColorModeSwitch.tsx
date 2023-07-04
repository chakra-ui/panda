import { css } from '@/styled-system/css'
import { useTheme } from 'next-themes'
import { ComponentPropsWithoutRef, useEffect, useState } from 'react'

export const ColorModeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const theme = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const { setTheme, resolvedTheme } = theme

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const IconToUse = isDark ? Moon : Sun
  const iconText = isDark ? 'Dark' : 'Light'

  return (
    <button title={iconText} onClick={toggleTheme} className={css({ cursor: 'pointer' })}>
      <IconToUse />
    </button>
  )
}

function Moon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M14.8776 11.7857C10.3878 11.7857 6.71429 8.11224 6.71429 3.62245C6.71429 2.88775 6.79592 2.15306 7.04082 1.5C3.53061 2.39796 1 5.58163 1 9.33673C1 13.8265 4.67347 17.5 9.16326 17.5C12.9184 17.5 16.102 14.9694 17 11.4592C16.3469 11.7041 15.6122 11.7857 14.8776 11.7857Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="square"
      />
    </svg>
  )
}

function Sun(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5.76 4.83999L3.96 3.04999L2.55 4.45999L4.34 6.24999L5.76 4.83999ZM0 10.5H3V12.5H0V10.5ZM10 0.549988H12V3.49999H10V0.549988ZM18.04 3.04499L19.448 4.45199L17.658 6.24199L16.251 4.83399L18.04 3.04499ZM16.24 18.16L18.03 19.96L19.44 18.55L17.64 16.76L16.24 18.16ZM19 10.5H22V12.5H19V10.5ZM11 5.49999C7.69 5.49999 5 8.18999 5 11.5C5 14.81 7.69 17.5 11 17.5C14.31 17.5 17 14.81 17 11.5C17 8.18999 14.31 5.49999 11 5.49999ZM11 15.5C8.79 15.5 7 13.71 7 11.5C7 9.28999 8.79 7.49999 11 7.49999C13.21 7.49999 15 9.28999 15 11.5C15 13.71 13.21 15.5 11 15.5ZM10 19.5H12V22.45H10V19.5ZM2.55 18.54L3.96 19.95L5.75 18.15L4.34 16.74L2.55 18.54Z"
        fill="currentColor"
      />
    </svg>
  )
}
