import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs'
import { getVstackStyle } from '../patterns/vstack.mjs'

export const VStack = forwardRef(function VStack(props, ref) {
  const { justify, gap, ...restProps } = props
  const styleProps = getVstackStyle({ justify, gap })
  return createElement(panda.div, { ref, ...styleProps, ...restProps })
})
