/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type HstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: PropertyValue<'gap'>
}


type HstackOptions = HstackProperties & Omit<SystemStyleObject, keyof HstackProperties >


export declare function hstack(options?: HstackOptions): string
