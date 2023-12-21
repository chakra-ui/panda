import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { splitProps } from '../helpers.mjs';
import { getLinkOverlayStyle } from '../patterns/link-overlay.mjs';
import { panda } from './factory.mjs';

export const LinkOverlay = /* @__PURE__ */ forwardRef(function LinkOverlay(props, ref) {
  const [patternProps, restProps] = splitProps(props, [])

const styleProps = getLinkOverlayStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.a, mergedProps)
  })