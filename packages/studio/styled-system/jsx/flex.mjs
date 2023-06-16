import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs'
import { getFlexStyle } from '../patterns/flex.mjs'

export const Flex = forwardRef(function Flex(props, ref) {
  const { align, justify, direction, wrap, basis, grow, shrink, ...restProps } = props
  const styleProps = getFlexStyle({ align, justify, direction, wrap, basis, grow, shrink })
  return createElement(panda.div, { ref, ...styleProps, ...restProps })
})
