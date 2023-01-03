import { forwardRef } from 'react'
import { panda } from './factory'
import { getBoxStyle } from '../patterns/box'

export const Box = forwardRef(function Box(props, ref) {
  return <panda.div ref={ref} {...props} />
    
})    