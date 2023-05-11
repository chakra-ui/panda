import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens/tokens'

export type CircleProperties = {
   size?: PropertyValue<'width'>
}


type CircleOptions = CircleProperties & Omit<SystemStyleObject, keyof CircleProperties | 'width' | 'height' | 'borderRadius'>


export declare function circle(options?: CircleOptions): string
