import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getCircleStyle } from '../patterns/circle.mjs';

export const Circle = /* @__PURE__ */ forwardRef(function Circle(props, ref) {
  const { size, ...restProps } = props
const styleProps = getCircleStyle({size})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})