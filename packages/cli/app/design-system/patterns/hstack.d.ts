import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type HstackProperties = {
   justify?: SystemStyleObject["justifyContent"]
	gap?: ConditionalValue<Tokens["spacing"]>
}


type HstackOptions = HstackProperties & Omit<SystemStyleObject, keyof HstackProperties >


export declare function hstack(options: HstackOptions): string
