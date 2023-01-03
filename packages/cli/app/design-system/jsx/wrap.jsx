import { forwardRef } from 'react'
import { panda } from './factory'
import { getWrapStyle } from '../patterns/wrap'

export const Wrap = forwardRef(function Wrap(props, ref) {
  const { gap, gapX, gapY, align, justify, ...restProps } = props
const styleProps = getWrapStyle({gap, gapX, gapY, align, justify})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    