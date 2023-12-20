import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getWrapStyle } from '../patterns/wrap.mjs';

export const Wrap = /* @__PURE__ */ forwardRef(function Wrap(props, ref) {
  const { gap, rowGap, columnGap, align, justify, ...restProps } = props
const styleProps = getWrapStyle({gap, rowGap, columnGap, align, justify})

const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })