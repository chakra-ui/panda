import { panda, type HTMLPandaProps } from '@/styled-system/jsx'
import { cloneElement, isValidElement } from 'react'

export const ButtonIcon = (props: HTMLPandaProps<'span'>) => {
  const { children, ...rest } = props

  const _children = isValidElement(children)
    ? cloneElement(children, {
        // @ts-expect-error typings are wrong
        'aria-hidden': true,
        focusable: false
      })
    : children

  return (
    <panda.span data-scope="button" data-part="icon" {...rest}>
      {_children}
    </panda.span>
  )
}
