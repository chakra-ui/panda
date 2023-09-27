import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getLinkOverlayStyle } from '../patterns/link-overlay.mjs';

export const LinkOverlay = /* @__PURE__ */ forwardRef(function LinkOverlay(props, ref) {
  const styleProps = getLinkOverlayStyle()
return createElement(styled.a, { ref, ...styleProps, ...props })
})