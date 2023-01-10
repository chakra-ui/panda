import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type GridItemProperties = {
   colSpan?: ConditionalValue<number>
	rowSpan?: ConditionalValue<number>
	colStart?: ConditionalValue<number>
	rowStart?: ConditionalValue<number>
	colEnd?: ConditionalValue<number>
	rowEnd?: ConditionalValue<number>
}

        
type GridItemOptions = GridItemProperties & {
  [K in keyof Omit<SystemStyleObject, keyof GridItemProperties >]?: SystemStyleObject[K]
}


export declare function gridItem(options: GridItemOptions): string
