import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getContainerStyle } from '../patterns/container.mjs';

export const Container = forwardRef(function Container(props, ref) {
  const { size, ...restProps } = props
const styleProps = getContainerStyle({size})
return createElement(styled.div, { ref, ...styleProps, ...restProps })
})    