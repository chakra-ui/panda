import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type WrapProperties = {
   gap?: PropertyValue<'gap'>
	gapX?: PropertyValue<'gap'>
	gapY?: PropertyValue<'gap'>
	align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
}

        
type WrapOptions = WrapProperties & Omit<SystemStyleObject, keyof WrapProperties >


export declare function wrap(options: WrapOptions): string
