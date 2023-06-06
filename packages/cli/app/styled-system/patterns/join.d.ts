import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type JoinProperties = {
   orientation?: ConditionalValue<"horizontal" | "vertical">
}


type JoinOptions = JoinProperties & Omit<SystemStyleObject, keyof JoinProperties >


export declare function join(options?: JoinOptions): string
