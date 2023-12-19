import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getStackStyle } from '../patterns/stack.mjs';

export const Stack = /* @__PURE__ */ forwardRef(function Stack(props, ref) {
  const { align, justify, direction, gap, ...restProps } = props
const styleProps = getStackStyle({align, justify, direction, gap})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })