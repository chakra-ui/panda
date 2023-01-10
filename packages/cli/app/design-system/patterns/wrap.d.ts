import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type WrapProperties = {
   gap?: ConditionalValue<Tokens["spacing"]>
	gapX?: ConditionalValue<Tokens["spacing"]>
	gapY?: ConditionalValue<Tokens["spacing"]>
	align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
}

        
type WrapOptions = WrapProperties & {
  [K in keyof Omit<SystemStyleObject, keyof WrapProperties >]?: SystemStyleObject[K]
}


export declare function wrap(options: WrapOptions): string
