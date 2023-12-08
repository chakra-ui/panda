import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getCircleStyle } from '../patterns/circle.mjs';

export const Circle = /* @__PURE__ */ forwardRef(function Circle(props, ref) {
  const { size, ...restProps } = props
const styleProps = getCircleStyle({size})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })