import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getHstackStyle } from '../patterns/hstack.mjs';

export const HStack = forwardRef(function HStack(props, ref) {
  const { justify, gap, ...restProps } = props
const styleProps = getHstackStyle({justify, gap})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})    