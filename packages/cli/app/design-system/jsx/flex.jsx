import { forwardRef } from 'react'
import { panda } from './factory'
import { getFlexStyle } from '../patterns/flex'

export const Flex = forwardRef(function Flex(props, ref) {
  const { align, justify, direction, wrap, basis, grow, shrink, ...restProps } = props
const styleProps = getFlexStyle({align, justify, direction, wrap, basis, grow, shrink})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    