import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getVisuallyHiddenStyle } from '../patterns/visually-hidden.mjs';

export const VisuallyHidden = /* @__PURE__ */ forwardRef(function VisuallyHidden(props, ref) {
  const restProps = props
const styleProps = getVisuallyHiddenStyle()
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })