import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getDividerStyle } from '../patterns/divider.mjs';

export const Divider = /* @__PURE__ */ forwardRef(function Divider(props, ref) {
  const { orientation, thickness, color, ...restProps } = props
const styleProps = getDividerStyle({orientation, thickness, color})

const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })