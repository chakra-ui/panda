import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getLinkOverlayStyle } from '../patterns/link-overlay.mjs';

export const LinkOverlay = /* @__PURE__ */ forwardRef(function LinkOverlay(props, ref) {
  const restProps = props
const styleProps = getLinkOverlayStyle()
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.a, mergedProps)
  })