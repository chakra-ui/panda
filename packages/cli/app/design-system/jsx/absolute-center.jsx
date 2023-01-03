import { forwardRef } from 'react'
import { panda } from './factory'
import { getAbsoluteCenterStyle } from '../patterns/absolute-center'

export const AbsoluteCenter = forwardRef(function AbsoluteCenter(props, ref) {
  const { axis, ...restProps } = props
const styleProps = getAbsoluteCenterStyle({axis})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    