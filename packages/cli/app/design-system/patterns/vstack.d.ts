import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type VstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: ConditionalValue<Tokens["spacing"]>
}

        
type VstackOptions = VstackProperties & {
  [K in keyof Omit<SystemStyleObject, keyof VstackProperties >]?: SystemStyleObject[K]
}


export declare function vstack(options: VstackOptions): string
