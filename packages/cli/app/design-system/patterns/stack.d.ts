import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type StackProperties = {
   align?: SystemStyleObject["alignItems"]
	justify?: SystemStyleObject["justifyContent"]
	direction?: SystemStyleObject["flexDirection"]
	gap?: ConditionalValue<Tokens["spacing"]>
}



export declare function stack(options: SystemStyleObject<StackProperties>): string
