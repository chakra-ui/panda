import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getStackStyle } from '../patterns/stack.mjs';

export const Stack = forwardRef(function Stack(props, ref) {
  const { align, justify, direction, gap, ...restProps } = props
const styleProps = getStackStyle({align, justify, direction, gap})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})    