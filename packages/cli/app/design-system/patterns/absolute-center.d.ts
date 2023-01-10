import { SystemStyleObject, ConditionalValue } from '../types'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type AbsoluteCenterProperties = {
   axis?: ConditionalValue<"x" | "y" | "both">
}


type AbsoluteCenterOptions = AbsoluteCenterProperties & Omit<SystemStyleObject, keyof AbsoluteCenterProperties >


export declare function absoluteCenter(options: AbsoluteCenterOptions): string
