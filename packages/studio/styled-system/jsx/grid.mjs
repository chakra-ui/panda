import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getGridStyle } from '../patterns/grid.mjs';

export const Grid = /* @__PURE__ */ forwardRef(function Grid(props, ref) {
  const { gap, columnGap, rowGap, columns, minChildWidth, ...restProps } = props
const styleProps = getGridStyle({gap, columnGap, rowGap, columns, minChildWidth})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })