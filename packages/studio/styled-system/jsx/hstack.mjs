import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getHstackStyle } from '../patterns/hstack.mjs';

export const HStack = /* @__PURE__ */ forwardRef(function HStack(props, ref) {
  const { justify, gap, ...restProps } = props
const styleProps = getHstackStyle({justify, gap})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})