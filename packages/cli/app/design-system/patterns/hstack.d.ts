import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type HstackProperties = {
   justify?: SystemStyleObject["justifyContent"]
	gap?: ConditionalValue<Tokens["spacing"]>
}



export declare function hstack(options: SystemStyleObject<HstackProperties>): string
