import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getVisuallyHiddenStyle } from '../patterns/visually-hidden.mjs';

export const VisuallyHidden = /* @__PURE__ */ forwardRef(function VisuallyHidden(props, ref) {
  const styleProps = getVisuallyHiddenStyle()
return createElement(panda.div, { ref, ...styleProps, ...props })
})