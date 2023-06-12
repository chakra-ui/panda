'use client'
import { css, cx } from '@/styled-system/css'
import { panda, type HTMLPandaProps } from '@/styled-system/jsx'
import { DocsButtonVariantProps, docsButton } from '@/styled-system/recipes'
import { cloneElement, isValidElement } from 'react'

export type IconButtonProps = HTMLPandaProps<'button'> &
  DocsButtonVariantProps & { icon?: React.ReactElement; 'aria-label': string }

export const IconButton = (props: IconButtonProps) => {
  const { icon, variant, size, children, className, ...rest } = props

  const element = icon || children
  const _children = isValidElement(element)
    ? cloneElement(element, {
        // @ts-expect-error typings are wrong
        'aria-hidden': true,
        'data-scope': 'docsButton',
        'data-part': 'icon',
        focusable: false
      })
    : null

    console.log(docsButton({ variant, size }))
  return (
    <panda.button
      className={cx(docsButton({ variant, size }), css({ px: '0' }), className)}
      {...rest}
      data-scope="docsButton"
      data-part="root"
    >
      {_children}
    </panda.button>
  )
}
