import { forwardRef } from 'react'
import { panda } from './factory'
import { getCircleStyle } from '../patterns/circle'

export const Circle = forwardRef(function Circle(props, ref) {
  const { size, ...restProps } = props
const styleProps = getCircleStyle({size})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    