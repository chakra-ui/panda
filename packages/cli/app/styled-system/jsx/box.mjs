import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getBoxStyle } from '../patterns/box.mjs';

export const Box = forwardRef(function Box(props, ref) {
  return createElement(panda.div, { ref, ...props })
})    