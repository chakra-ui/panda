import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type AbsoluteCenterProperties = {
   axis?: ConditionalValue<"x" | "y" | "both">
}



export declare function absoluteCenter(options: SystemStyleObject<AbsoluteCenterProperties>): string
