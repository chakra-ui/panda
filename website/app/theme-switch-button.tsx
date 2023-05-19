// prettier-ignore
'use client'

import { useMounted } from 'nextra/hooks'
import { useTheme } from 'next-themes'

import { HTMLPandaProps, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon } from '../theme/icons'
import { css, cx } from '../styled-system/css'

export function ThemeSwitchButton({
  lite,
  ...props
}: HTMLPandaProps<'button'> & { lite?: boolean }) {
  const theme = useTheme()
  const { setTheme, resolvedTheme } = theme
  const mounted = useMounted()

  const isDark = mounted && resolvedTheme === 'dark'
  const iconToUse = isDark ? 'Moon' : 'Sun'

  return (
    <panda.button
      opacity={mounted ? 1 : 0}
      transitionProperty="opacity"
      className={cx(
        button({ color: 'ghost' }),
        // prevent layout shift with predefined width
        !lite ? css({ w: '125px' }) : undefined
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      {...props}
    >
      <span className={lite ? css({ display: 'none' }) : ''}>
        {isDark ? 'Dark' : 'Light'}{' '}
      </span>
      <ButtonIcon
        icon={iconToUse}
        className={lite ? css({ mx: 0 }) : undefined}
      />
    </panda.button>
  )
}
