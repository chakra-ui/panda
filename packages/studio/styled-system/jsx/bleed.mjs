import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getBleedStyle } from '../patterns/bleed.mjs';

export const Bleed = /* @__PURE__ */ forwardRef(function Bleed(props, ref) {
  const { inline, block, ...restProps } = props
const styleProps = getBleedStyle({inline, block})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })