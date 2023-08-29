import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getLinkBoxStyle } from '../patterns/link-box.mjs';

export const LinkBox = /* @__PURE__ */ forwardRef(function LinkBox(props, ref) {
  const styleProps = getLinkBoxStyle()
return createElement(panda.div, { ref, ...styleProps, ...props })
})