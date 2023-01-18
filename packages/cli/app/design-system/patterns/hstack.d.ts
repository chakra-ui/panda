import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type HstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: PropertyValue<'gap'>
}

        
type HstackOptions = HstackProperties & Omit<SystemStyleObject, keyof HstackProperties >


export declare function hstack(options: HstackOptions): string
