import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../types/token'

export type AbsoluteCenterProperties = {
   axis?: ConditionalValue<"x" | "y" | "both">
}

        
type AbsoluteCenterOptions = AbsoluteCenterProperties & Omit<SystemStyleObject, keyof AbsoluteCenterProperties >


export declare function absoluteCenter(options?: AbsoluteCenterOptions): string
