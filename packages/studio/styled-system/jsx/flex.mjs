import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getFlexStyle } from '../patterns/flex.mjs';

export const Flex = /* @__PURE__ */ forwardRef(function Flex(props, ref) {
  const { align, justify, direction, wrap, basis, grow, shrink, ...restProps } = props
const styleProps = getFlexStyle({align, justify, direction, wrap, basis, grow, shrink})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })