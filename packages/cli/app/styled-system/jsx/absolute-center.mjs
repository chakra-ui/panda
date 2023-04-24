import { createElement, forwardRef } from 'react'
import { panda } from './factory.mjs';
import { getAbsoluteCenterStyle } from '../patterns/absolute-center.mjs';

export const AbsoluteCenter = forwardRef(function AbsoluteCenter(props, ref) {
  const { axis, ...restProps } = props
const styleProps = getAbsoluteCenterStyle({axis})
return createElement(panda.div, { ref, ...styleProps, ...restProps })
})    