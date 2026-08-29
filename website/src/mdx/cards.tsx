import { css, cx, sva } from '@/styled-system/css'
import Link from 'next/link'
import { LuArrowRight } from 'react-icons/lu'

const cardStyles = sva({
  slots: ['root', 'icon', 'kicker', 'title', 'body', 'cta'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      height: 'full',
      p: '5',
      borderWidth: '1px',
      borderColor: 'border',
      color: 'fg',
      textDecoration: 'none',
      transitionProperty: 'background-color, border-color',
      transitionDuration: '150ms',
      _hover: { borderColor: 'fg.subtle', bg: 'bg.subtle' }
    },
    icon: {
      display: 'flex',
      color: 'accent.emphasis',
      mb: '1',
      '& svg': { width: '1.25rem', height: '1.25rem' }
    },
    kicker: {
      textStyle: 'eyebrow',
      color: 'fg.subtle'
    },
    title: {
      textStyle: 'lg',
      fontWeight: 'semibold',
      lineHeight: '1.3'
    },
    body: {
      textStyle: 'sm',
      lineHeight: '1.6',
      color: 'fg.muted'
    },
    cta: {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      mt: 'auto',
      pt: '3',
      textStyle: 'sm',
      color: 'fg.muted'
    }
  },
  variants: {
    mode: {
      gapped: {
        root: { rounded: 'lg' }
      },
      gapless: {
        root: {
          rounded: 'none',
          gap: '1',
          margin: '-0.5px'
        }
      }
    }
  },
  defaultVariants: { mode: 'gapped' }
})

interface CardProps {
  title: string
  href: string
  children?: React.ReactNode
  description?: string
  icon?: React.ReactNode
  kicker?: string
  cta?: React.ReactNode
  arrow?: boolean
  mode?: 'gapped' | 'gapless'
}

export const Card = (props: CardProps) => {
  const { title, href, children, description, icon, kicker, cta, arrow, mode } =
    props
  const classes = cardStyles({ mode })
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
        {arrow && (
          <LuArrowRight
            className={css({
              display: 'inline',
              ml: '2',
              verticalAlign: 'middle',
              color: 'fg.subtle'
            })}
          />
        )}
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

const columnStyles = {
  1: css({ gridTemplateColumns: '1fr' }),
  2: css({
    gridTemplateColumns: { base: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }
  }),
  3: css({
    gridTemplateColumns: {
      base: '1fr',
      sm: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(3, minmax(0, 1fr))'
    }
  }),
  4: css({
    gridTemplateColumns: {
      base: '1fr',
      sm: 'repeat(2, minmax(0, 1fr))',
      lg: 'repeat(4, minmax(0, 1fr))'
    }
  })
}

const gapStyles = {
  gapped: css({ gap: '4' }),
  gapless: css({ gap: '0' })
}

const gridBase = css({ display: 'grid', my: '8' })

interface CardsProps extends React.ComponentProps<'div'> {
  columns?: 1 | 2 | 3 | 4
  mode?: 'gapped' | 'gapless'
}

export const Cards = (props: CardsProps) => {
  const { className, columns = 2, mode = 'gapped', children, ...rest } = props

  return (
    <div
      data-mode={mode}
      className={cx(
        gridBase,
        columnStyles[columns] ?? columnStyles[2],
        gapStyles[mode] ?? gapStyles.gapped,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
