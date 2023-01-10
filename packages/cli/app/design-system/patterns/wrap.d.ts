import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type WrapProperties = {
   gap?: ConditionalValue<Tokens["spacing"]>
	gapX?: ConditionalValue<Tokens["spacing"]>
	gapY?: ConditionalValue<Tokens["spacing"]>
	align?: SystemStyleObject["alignItems"]
	justify?: SystemStyleObject["justifyContent"]
}


type WrapOptions = WrapProperties & Omit<SystemStyleObject, keyof WrapProperties >


export declare function wrap(options: WrapOptions): string
