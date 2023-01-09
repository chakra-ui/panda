import { SystemStyleObject, ConditionalValue } from "../types"
import { Properties } from "../types/csstype"
import { Tokens } from "../types/token"

export type ContainerProperties = {
   centerContent?: ConditionalValue<boolean>
}



export declare function container(options: SystemStyleObject<ContainerProperties>): string
