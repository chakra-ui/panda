'use client'

import { css, cx } from '@/styled-system/css'
import { grid } from '@/styled-system/patterns'
import { docCard } from '@/styled-system/recipes'
import Link from 'next/link'
import { createContext, useContext } from 'react'
import { LuArrowRight } from 'react-icons/lu'

type Mode = 'gapped' | 'gapless'

const ModeContext = createContext<Mode>('gapped')

interface CardProps {
  title: string
  href: string
  children?: React.ReactNode
  description?: string
  icon?: React.ReactNode
  kicker?: string
  cta?: React.ReactNode
  arrow?: boolean
  mode?: Mode
}

const inlineArrow = css({
  display: 'inline',
  ml: '2',
  verticalAlign: 'middle',
  color: 'fg.subtle'
})

export const Card = (props: CardProps) => {
  const { title, href, children, description, icon, kicker, cta, arrow, mode } =
    props
  const groupMode = useContext(ModeContext)
  const classes = docCard({ mode: mode ?? groupMode })
  const external = href.startsWith('http')

  return (
    <Link
      href={href}
      className={classes.root}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {icon && <span className={classes.icon}>{icon}</span>}
      {kicker && <span className={classes.kicker}>{kicker}</span>}
      <span className={classes.title}>
        {title}
        {arrow && <LuArrowRight className={inlineArrow} />}
      </span>
      {(description || children) && (
        <span className={classes.body}>{description ?? children}</span>
      )}
      {cta && (
        <span className={classes.cta}>
          {cta}
          <LuArrowRight />
        </span>
      )}
    </Link>
  )
}

interface CardsProps extends React.ComponentProps<'div'> {
  columns?: 1 | 2 | 3 | 4
  mode?: Mode
}

const gridStyles = {
  1: grid({ columns: 1, gap: '4', my: '8' }),
  2: grid({ columns: { base: 1, sm: 2 }, gap: '4', my: '8' }),
  3: grid({ columns: { base: 1, sm: 2, lg: 3 }, gap: '4', my: '8' }),
  4: grid({ columns: { base: 1, sm: 2, lg: 4 }, gap: '4', my: '8' })
}

const gaplessGrid = css({ gap: '0' })

export const Cards = (props: CardsProps) => {
  const { className, columns = 2, mode = 'gapped', children, ...rest } = props

  return (
    <ModeContext.Provider value={mode}>
      <div
        data-mode={mode}
        className={cx(
          gridStyles[columns] ?? gridStyles[2],
          mode === 'gapless' && gaplessGrid,
          className
        )}
        {...rest}
      >
        {children}
      </div>
    </ModeContext.Provider>
  )
}
