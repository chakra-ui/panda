import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getLinkBoxStyle } from '../patterns/link-box.mjs';

export const LinkBox = /* @__PURE__ */ forwardRef(function LinkBox(props, ref) {
  const restProps = props
const styleProps = getLinkBoxStyle()
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })