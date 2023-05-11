import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { Anchor } from './anchor'
import { css, cx } from '../../styled-system/css'
import { card } from '../../styled-system/recipes'

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
        data-scope="card"
        data-part="root"
        className={cx('group', card({ variant: 'image' }))}
        href={href}
        {...props}
      >
        {children}
        <span data-scope="card" data-part="content">
          {icon}
          <span data-scope="card" data-part="title">
            {title}
            {animatedArrow}
          </span>
        </span>
      </Anchor>
    )
  }

  return (
    <Anchor
      data-scope="card"
      data-part="root"
      className={cx('group', card())}
      href={href}
      {...props}
    >
      <span data-scope="card" data-part="content">
        {icon}
        <span data-scope="card" data-part="title">
          {title}
          {animatedArrow}
        </span>
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
      className={cx(
        css({
          gridTemplateColumns:
            'repeat(auto-fill, minmax(max(250px, calc((100% - 1rem * 2) / var(--rows))), 1fr))',
          mt: 4,
          gap: 4,
          display: 'grid'
        }),
        className
      )}
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
