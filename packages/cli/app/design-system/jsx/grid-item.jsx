import { forwardRef } from 'react'
import { panda } from './factory'
import { getGridItemStyle } from '../patterns/grid-item'

export const GridItem = forwardRef(function GridItem(props, ref) {
  const { colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd, ...restProps } = props
const styleProps = getGridItemStyle({colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd})
return <panda.div ref={ref} {...styleProps} {...restProps} />
    
})    