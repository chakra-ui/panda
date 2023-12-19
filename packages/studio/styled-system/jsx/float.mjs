import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getFloatStyle } from '../patterns/float.mjs';

export const Float = /* @__PURE__ */ forwardRef(function Float(props, ref) {
  const { offsetX, offsetY, offset, placement, ...restProps } = props
const styleProps = getFloatStyle({offsetX, offsetY, offset, placement})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })