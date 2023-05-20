import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getIndicatorStyle } from '../patterns/indicator.mjs';

export const Indicator = forwardRef(function Indicator(props, ref) {
  const { offsetX, offsetY, placement, ...restProps } = props
const styleProps = getIndicatorStyle({offsetX, offsetY, placement})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})    