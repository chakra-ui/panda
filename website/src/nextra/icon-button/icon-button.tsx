'use client'
import { ButtonVariants, buttonStyles } from '@/nextra/button'
import { css, cx } from '@/styled-system/css'
import { panda, type HTMLPandaProps } from '@/styled-system/jsx'
import { cloneElement, isValidElement } from 'react'

export type IconButtonProps = HTMLPandaProps<'button'> &
ButtonVariants & { icon?: React.ReactElement; 'aria-label': string }

export const IconButton = (props: IconButtonProps) => {
  const { icon, variant, size, children, className, ...rest } = props

  const element = icon || children
  const _children = isValidElement(element)
    ? cloneElement(element, {
        // @ts-expect-error typings are wrong
        'aria-hidden': true,
        focusable: false
      })
    : null

  return (
    <panda.button
      className={cx(buttonStyles({ variant, size }), css({ px: '0' }), className)}
      {...rest}
    >
      {_children}
    </panda.button>
  )
}
