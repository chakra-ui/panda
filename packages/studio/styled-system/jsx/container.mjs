import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getContainerStyle } from '../patterns/container.mjs';

export const Container = /* @__PURE__ */ forwardRef(function Container(props, ref) {
  const restProps = props
const styleProps = getContainerStyle()
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })