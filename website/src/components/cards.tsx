import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { Anchor } from './anchor'
import { css, cx } from '../../styled-system/css'

const classes = {
  cards: cx('nextra-cards', css({ mt: 4, gap: 4, display: 'grid' })),
  card: cx(
    'nextra-card group', // TODO group ?
    css({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'start',
      overflow: 'hidden',
      borderRadius: 'lg',
      border: '1px solid',
      borderColor: 'gray.200',
      color: 'currentColor',
      textDecorationLine: 'none',
      shadow: 'gray.100',
      transitionProperty: 'all',
      transitionDuration: '200ms',
      _hover: {
        shadowColor: 'gray.100',
        borderColor: 'gray.300'
      },
      _active: {
        shadow: 'sm',
        shadowColor: 'gray.200'
      },
      _dark: {
        _hover: { shadow: 'none' },
        shadow: 'none',
        borderColor: 'rgb(from token(colors.gray.700) / 30%)', // TODO
        backgroundColor: 'rgb(from token(colors.gray.900) / 30%)'
      }
    })
  ),
  title: cx(
    css({
      display: 'flex',
      fontWeight: 'semibold',
      alignItems: 'start',
      gap: 2,
      p: 4,
      color: 'gray.700',
      _hover: { color: 'gray.900' }
    })
  )
}

const arrowEl = (
  <span
    className={css({
      transitionProperty: 'transform',
      transitionDuration: '75ms',
      _groupHover: { transform: 'translateX(2px)' }
    })}
  >
    →
  </span>
)

export function Card({
  children,
  title,
  icon,
  image,
  arrow,
  href,
  ...props
}: {
  children: ReactNode
  title: string
  icon: ReactNode
  image?: boolean
  arrow?: boolean
  href: string
}) {
  const animatedArrow = arrow ? arrowEl : null

  if (image) {
    return (
      <Anchor
        href={href}
        className={cx(
          classes.card,
          css({
            bgColor: 'gray.100',
            shadow: 'md',
            _dark: {
              borderColor: 'rgb(64 64 64)',
              backgroundColor: 'rgb(38 38 38)',
              color: 'gray.50',
              _hover: {
                borderColor: 'rgb(115 115 115 / 1)',
                backgroundColor: 'rgb(64 64 64 / 1)'
              }
            },
            _hover: {
              shadow: 'lg'
            }
          })
        )}
        {...props}
      >
        {children}
        <span
          className={cx(
            classes.title,
            css({ _dark: { color: 'gray.300', _hover: { color: 'gray.100' } } })
          )}
        >
          {icon}
          <span className={css({ display: 'flex', gap: 1 })}>
            {title}
            {animatedArrow}
          </span>
        </span>
      </Anchor>
    )
  }

  return (
    <Anchor
      href={href}
      className={cx(
        classes.card,
        css({
          bg: 'transparent',
          shadow: 'sm',
          _dark: {
            borderColor: 'rgb(38 38 38 / 1)',
            _hover: {
              borderColor: 'rgb(64 64 64 / 1)',
              backgroundColor: 'rgb(115 115 115 / 1)'
            }
          },
          _hover: {
            bgColor: 'slate.50',
            shadow: 'md'
          }
        })
      )}
      {...props}
    >
      <span
        className={cx(
          classes.title,
          css({
            _dark: {
              color: 'rgb(229 229 229 / 1)',
              _hover: { color: 'rgb(250 250 250 / 1)' }
            }
          })
        )}
      >
        {icon}
        {title}
        {animatedArrow}
      </span>
    </Anchor>
  )
}

export function Cards({
  children,
  num = 3,
  className,
  style,
  ...props
}: { num?: number } & ComponentProps<'div'>) {
  return (
    <div
      className={cx(classes.cards, className)}
      {...props}
      style={
        {
          ...style,
          '--rows': num
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
