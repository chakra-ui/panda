import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs'
import { getStyledLinkStyle } from '../patterns/styled-link.mjs'

export const StyledLink = forwardRef(function StyledLink(props, ref) {
  const styleProps = getStyledLinkStyle()
  return createElement(panda.div, { ref, ...styleProps, ...props })
})
