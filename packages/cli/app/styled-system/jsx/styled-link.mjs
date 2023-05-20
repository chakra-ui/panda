import { createElement, forwardRef } from 'react'
import { styled } from './factory.mjs';
import { getStyledLinkStyle } from '../patterns/styled-link.mjs';

export const StyledLink = forwardRef(function StyledLink(props, ref) {
  return createElement(styled.div, { ref, ...props })
})    