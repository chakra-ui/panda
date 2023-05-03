import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/tokens'

export type WrapProperties = {
   gap?: PropertyValue<'gap'>
	gapX?: PropertyValue<'gap'>
	gapY?: PropertyValue<'gap'>
	align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
}


type WrapOptions = WrapProperties & Omit<SystemStyleObject, keyof WrapProperties >


export declare function wrap(options?: WrapOptions): string
