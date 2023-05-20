import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getWrapStyle } from '../patterns/wrap.mjs';

export const Wrap = forwardRef(function Wrap(props, ref) {
  const { gap, rowGap, columnGap, align, justify, ...restProps } = props
const styleProps = getWrapStyle({gap, rowGap, columnGap, align, justify})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})    