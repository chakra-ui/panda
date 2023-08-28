/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type GridItemProperties = {
   colSpan?: ConditionalValue<number>
	rowSpan?: ConditionalValue<number>
	colStart?: ConditionalValue<number>
	rowStart?: ConditionalValue<number>
	colEnd?: ConditionalValue<number>
	rowEnd?: ConditionalValue<number>
}


type GridItemStyles = GridItemProperties & DistributiveOmit<SystemStyleObject, keyof GridItemProperties >

interface GridItemPatternFn {
  (styles?: GridItemStyles): string
  raw: (styles: GridItemStyles) => GridItemStyles
}


export declare const gridItem: GridItemPatternFn;
