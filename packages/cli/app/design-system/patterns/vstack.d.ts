import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type VstackProperties = {
   justify?: SystemStyleObject["justifyContent"]
	gap?: ConditionalValue<Tokens["spacing"]>
}



export declare function vstack(options: SystemStyleObject<VstackProperties>): string
