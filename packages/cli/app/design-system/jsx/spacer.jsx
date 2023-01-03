import { forwardRef } from 'react'
import { panda } from './factory'
import { getSpacerStyle } from '../patterns/spacer'

export const Spacer = forwardRef(function Spacer(props, ref) {
  const { size, ...restProps } = props
const styleProps = getSpacerStyle({size})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    