import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getBoxStyle } from '../patterns/box.mjs';

export const Box = /* @__PURE__ */ forwardRef(function Box(props, ref) {
  const {  ...restProps } = props
const styleProps = getBoxStyle({})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })