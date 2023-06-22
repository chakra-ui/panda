import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs'
import { getLinkOverlayStyle } from '../patterns/link-overlay.mjs'

export const LinkOverlay = forwardRef(function LinkOverlay(props, ref) {
  const styleProps = getLinkOverlayStyle()
  return createElement(panda.a, { ref, ...styleProps, ...props })
})
