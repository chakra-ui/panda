import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type CircleProperties = {
   size?: ConditionalValue<Tokens["sizes"]>
}



export declare function circle(options: SystemStyleObject<CircleProperties>): string
