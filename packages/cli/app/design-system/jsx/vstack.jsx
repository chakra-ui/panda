import { forwardRef } from 'react'
import { panda } from './factory'
import { getVstackStyle } from '../patterns/vstack'

export const VStack = forwardRef(function VStack(props, ref) {
  const { justify, gap, ...restProps } = props
const styleProps = getVstackStyle({justify, gap})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    