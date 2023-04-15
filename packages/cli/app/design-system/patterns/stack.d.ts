import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/token'

export type StackProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	gap?: PropertyValue<'gap'>
}

        
type StackOptions = StackProperties & Omit<SystemStyleObject, keyof StackProperties | 'flexDirection' | 'alignItems' | 'justifyContent'>


export declare function stack(options?: StackOptions): string
