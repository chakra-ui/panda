/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type StackProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	gap?: PropertyValue<'gap'>
}


type StackOptions = StackProperties & Omit<SystemStyleObject, keyof StackProperties >

interface StackPatternFn {
  (options?: StackOptions): string
  raw: (options: StackOptions) => StackOptions
}


export declare const stack: StackPatternFn;
