import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens/tokens'

export type VstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: PropertyValue<'gap'>
}


type VstackOptions = VstackProperties & Omit<SystemStyleObject, keyof VstackProperties | 'flexDirection'>


export declare function vstack(options?: VstackOptions): string
