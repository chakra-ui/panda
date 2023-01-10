import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type VstackProperties = {
   justify?: SystemStyleObject["justifyContent"]
	gap?: ConditionalValue<Tokens["spacing"]>
}


type VstackOptions = VstackProperties & Omit<SystemStyleObject, keyof VstackProperties >


export declare function vstack(options: VstackOptions): string
