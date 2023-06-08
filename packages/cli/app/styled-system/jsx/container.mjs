import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getContainerStyle } from '../patterns/container.mjs';

export const Container = forwardRef(function Container(props, ref) {
  const styleProps = getContainerStyle()
return createElement(panda.div, { ref, ...styleProps, ...props })
})    