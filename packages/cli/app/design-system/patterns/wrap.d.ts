import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type WrapProperties = {
   gap?: ConditionalValue<Tokens["spacing"]>
	gapX?: ConditionalValue<Tokens["spacing"]>
	gapY?: ConditionalValue<Tokens["spacing"]>
	align?: SystemStyleObject["alignItems"]
	justify?: SystemStyleObject["justifyContent"]
}



export declare function wrap(options: SystemStyleObject<WrapProperties>): string
