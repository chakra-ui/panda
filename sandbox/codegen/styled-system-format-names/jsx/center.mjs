import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getCenterStyle } from '../patterns/center.mjs';

export const Center = /* @__PURE__ */ forwardRef(function Center(props, ref) {
  const { inline, ...restProps } = props
const styleProps = getCenterStyle({inline})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})