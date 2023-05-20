import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getDividerStyle } from '../patterns/divider.mjs';

export const Divider = forwardRef(function Divider(props, ref) {
  const { orientation, thickness, ...restProps } = props
const styleProps = getDividerStyle({orientation, thickness})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})    