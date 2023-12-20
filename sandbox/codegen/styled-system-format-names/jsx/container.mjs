import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getContainerStyle } from '../patterns/container.mjs';

export const Container = /* @__PURE__ */ forwardRef(function Container(props, ref) {
  const styleProps = getContainerStyle()
return createElement(styled.div, { ref, ...styleProps, ...props })
})