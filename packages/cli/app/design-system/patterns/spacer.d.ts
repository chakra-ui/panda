import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type SpacerProperties = {
   size?: ConditionalValue<Tokens["spacing"]>
}



export declare function spacer(options: SystemStyleObject<SpacerProperties>): string
