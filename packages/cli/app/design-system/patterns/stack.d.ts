import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type StackProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	gap?: PropertyValue<'gap'>
}

        
type StackOptions = StackProperties & Omit<SystemStyleObject, keyof StackProperties >


export declare function stack(options: StackOptions): string
