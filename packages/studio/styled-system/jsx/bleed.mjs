import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getBleedStyle } from '../patterns/bleed.mjs';

export const Bleed = /* @__PURE__ */ forwardRef(function Bleed(props, ref) {
  const { inline, block, ...restProps } = props
const styleProps = getBleedStyle({inline, block})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})