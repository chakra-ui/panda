import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type StackProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	gap?: ConditionalValue<Tokens["spacing"]>
}

        
type StackOptions = StackProperties & {
  [K in keyof Omit<SystemStyleObject, keyof StackProperties >]?: SystemStyleObject[K]
}


export declare function stack(options: StackOptions): string
