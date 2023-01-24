import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getGridStyle } from '../patterns/grid.mjs';

export const Grid = forwardRef(function Grid(props, ref) {
  const { gap, gapX, gapY, columns, minChildWidth, ...restProps } = props
const styleProps = getGridStyle({gap, gapX, gapY, columns, minChildWidth})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})    