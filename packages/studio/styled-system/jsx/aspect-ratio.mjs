import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getAspectRatioStyle } from '../patterns/aspect-ratio.mjs';

export const AspectRatio = /* @__PURE__ */ forwardRef(function AspectRatio(props, ref) {
  const { ratio, ...restProps } = props
const styleProps = getAspectRatioStyle({ratio})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})