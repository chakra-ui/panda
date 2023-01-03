import { forwardRef } from 'react'
import { panda } from './factory'
import { getStackStyle } from '../patterns/stack'

export const Stack = forwardRef(function Stack(props, ref) {
  const { align, justify, direction, gap, ...restProps } = props
const styleProps = getStackStyle({align, justify, direction, gap})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    