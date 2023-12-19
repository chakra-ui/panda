import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getCenterStyle } from '../patterns/center.mjs';

export const Center = /* @__PURE__ */ forwardRef(function Center(props, ref) {
  const { inline, ...restProps } = props
const styleProps = getCenterStyle({inline})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })