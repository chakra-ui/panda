import { forwardRef } from 'react'
import { panda } from './factory'
import { getGridStyle } from '../patterns/grid'

export const Grid = forwardRef(function Grid(props, ref) {
  const { gap, columns, minChildWidth, ...restProps } = props
const styleProps = getGridStyle({gap, columns, minChildWidth})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    