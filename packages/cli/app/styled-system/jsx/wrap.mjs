import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getWrapStyle } from '../patterns/wrap.mjs';

export const Wrap = forwardRef(function Wrap(props, ref) {
  const { gap, gapX, gapY, align, justify, ...restProps } = props
const styleProps = getWrapStyle({gap, gapX, gapY, align, justify})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})    