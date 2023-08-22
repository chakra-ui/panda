/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type GridItemProperties = {
   colSpan?: ConditionalValue<number>
	rowSpan?: ConditionalValue<number>
	colStart?: ConditionalValue<number>
	rowStart?: ConditionalValue<number>
	colEnd?: ConditionalValue<number>
	rowEnd?: ConditionalValue<number>
}


type GridItemOptions = GridItemProperties & Omit<SystemStyleObject, keyof GridItemProperties >

interface GridItemPatternFn {
  (options?: GridItemOptions): string
  raw: (options: GridItemOptions) => GridItemOptions
}


export declare const gridItem: GridItemPatternFn;
