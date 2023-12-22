import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { splitProps } from '../helpers.mjs';
import { getHstackStyle } from '../patterns/hstack.mjs';
import { panda } from './factory.mjs';

export const HStack = /* @__PURE__ */ forwardRef(function HStack(props, ref) {
  const [patternProps, restProps] = splitProps(props, ["justify","gap"])

const styleProps = getHstackStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })