import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getContainerStyle } from '../patterns/container.mjs';

export const Container = /* @__PURE__ */ forwardRef(function Container(props, ref) {
  const {  ...restProps } = props
const styleProps = getContainerStyle({})

const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })