import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getAspectRatioStyle } from '../patterns/aspect-ratio.mjs';

export const AspectRatio = /* @__PURE__ */ forwardRef(function AspectRatio(props, ref) {
  const { ratio, ...restProps } = props
const styleProps = getAspectRatioStyle({ratio})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })