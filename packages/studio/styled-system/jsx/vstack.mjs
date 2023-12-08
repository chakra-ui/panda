import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getVstackStyle } from '../patterns/vstack.mjs';

export const VStack = /* @__PURE__ */ forwardRef(function VStack(props, ref) {
  const { justify, gap, ...restProps } = props
const styleProps = getVstackStyle({justify, gap})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })