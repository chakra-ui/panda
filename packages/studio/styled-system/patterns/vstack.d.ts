/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type VstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: PropertyValue<'gap'>
}


type VstackOptions = VstackProperties & Omit<SystemStyleObject, keyof VstackProperties >


export declare function vstack(options?: VstackOptions): string
