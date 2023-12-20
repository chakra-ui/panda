import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getFlexStyle } from '../patterns/flex.mjs';

export const Flex = /* @__PURE__ */ forwardRef(function Flex(props, ref) {
  const { align, justify, direction, wrap, basis, grow, shrink, ...restProps } = props
const styleProps = getFlexStyle({align, justify, direction, wrap, basis, grow, shrink})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})