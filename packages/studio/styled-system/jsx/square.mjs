import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getSquareStyle } from '../patterns/square.mjs';

export const Square = /* @__PURE__ */ forwardRef(function Square(props, ref) {
  const { size, ...restProps } = props
const styleProps = getSquareStyle({size})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })