import { forwardRef } from 'react'
import { panda } from './factory'
import { getContainerStyle } from '../patterns/container'

export const Container = forwardRef(function Container(props, ref) {
  const { size, centerContent, ...restProps } = props
const styleProps = getContainerStyle({size, centerContent})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    