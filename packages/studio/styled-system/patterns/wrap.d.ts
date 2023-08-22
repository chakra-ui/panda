/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type WrapProperties = {
   gap?: PropertyValue<'gap'>
	rowGap?: PropertyValue<'gap'>
	columnGap?: PropertyValue<'gap'>
	align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
}


type WrapOptions = WrapProperties & Omit<SystemStyleObject, keyof WrapProperties >

interface WrapPatternFn {
  (options?: WrapOptions): string
  raw: (options: WrapOptions) => WrapOptions
}


export declare const wrap: WrapPatternFn;
