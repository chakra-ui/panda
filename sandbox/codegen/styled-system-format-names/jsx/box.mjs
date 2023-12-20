import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getBoxStyle } from '../patterns/box.mjs';

export const Box = /* @__PURE__ */ forwardRef(function Box(props, ref) {
  const styleProps = getBoxStyle()
return createElement(styled.div, { ref, ...styleProps, ...props })
})