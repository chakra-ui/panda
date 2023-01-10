import { SystemStyleObject, ConditionalValue } from '../types'
import { PropertyValue } from '../types/prop-type'
import { Properties } from '../types/csstype'
import { Tokens } from '../types/token'

export type AbsoluteCenterProperties = {
   axis?: ConditionalValue<"x" | "y" | "both">
}

        
type AbsoluteCenterOptions = AbsoluteCenterProperties & {
  [K in keyof Omit<SystemStyleObject, keyof AbsoluteCenterProperties >]?: SystemStyleObject[K]
}


export declare function absoluteCenter(options: AbsoluteCenterOptions): string
