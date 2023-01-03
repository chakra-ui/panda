import { forwardRef } from 'react'
import { panda } from './factory'
import { getHstackStyle } from '../patterns/hstack'

export const HStack = forwardRef(function HStack(props, ref) {
  const { justify, gap, ...restProps } = props
const styleProps = getHstackStyle({justify, gap})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    