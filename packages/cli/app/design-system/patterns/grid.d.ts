import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type GridProperties = {
   gap?: ConditionalValue<Tokens["spacing"]>
	columns?: ConditionalValue<number>
	minChildWidth?: ConditionalValue<Tokens["sizes"] | Properties["width"]>
}

        
type GridOptions = GridProperties & Omit<SystemStyleObject, keyof GridProperties >


export declare function grid(options: GridOptions): string
