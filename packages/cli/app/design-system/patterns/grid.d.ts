import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type GridProperties = {
   gap?: ConditionalValue<Tokens["spacing"]>
	columns?: ConditionalValue<number>
	minChildWidth?: ConditionalValue<Tokens["sizes"] | Properties["width"]>
}

        
type GridOptions = GridProperties & {
  [K in keyof Omit<SystemStyleObject, keyof GridProperties >]?: SystemStyleObject[K]
}


export declare function grid(options: GridOptions): string
