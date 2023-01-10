import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type StackProperties = {
   align?: SystemStyleObject["alignItems"]
	justify?: SystemStyleObject["justifyContent"]
	direction?: SystemStyleObject["flexDirection"]
	gap?: ConditionalValue<Tokens["spacing"]>
}


type StackOptions = StackProperties & Omit<SystemStyleObject, keyof StackProperties >


export declare function stack(options: StackOptions): string
