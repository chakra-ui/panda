import { createElement, forwardRef } from 'react'
import { mergeCss } from '../css/css.mjs';
import { splitProps } from '../helpers.mjs';
import { getStyledLinkStyle } from '../patterns/styled-link.mjs';
import { panda } from './factory.mjs';

export const StyledLink = /* @__PURE__ */ forwardRef(function StyledLink(props, ref) {
  const [patternProps, restProps] = splitProps(props, [])

const styleProps = getStyledLinkStyle(patternProps)
const mergedProps = { ref, ...styleProps, ...restProps }

return createElement(panda.div, mergedProps)
  })