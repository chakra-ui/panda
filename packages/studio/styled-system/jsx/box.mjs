import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getBoxStyle } from '../patterns/box.mjs';

export const Box = /* @__PURE__ */ forwardRef(function Box(props, ref) {
  const {  ...restProps } = props
const styleProps = getBoxStyle({})

const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })