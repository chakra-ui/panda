import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { panda } from './factory.mjs';
import { getStyledLinkStyle } from '../patterns/styled-link.mjs';

export const StyledLink = /* @__PURE__ */ forwardRef(function StyledLink(props, ref) {
  const {  ...restProps } = props
const styleProps = getStyledLinkStyle({})
const cssProps = styleProps
const mergedProps = { ref, ...cssProps, ...restProps }

return createElement(panda.div, mergedProps)
  })