import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getBoxStyle } from '../patterns/box.mjs';

export const Box = forwardRef(function Box(props, ref) {
  return createElement(styled.div, { ref, ...props })
})    