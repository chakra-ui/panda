import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs'
import { getJoinStyle } from '../patterns/join.mjs'

export const Join = forwardRef(function Join(props, ref) {
  const { orientation, ...restProps } = props
  const styleProps = getJoinStyle({ orientation })
  return createElement(panda.div, { ref, ...styleProps, ...restProps })
})
