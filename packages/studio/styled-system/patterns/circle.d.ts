/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type CircleProperties = {
   size?: PropertyValue<'width'>
}


type CircleOptions = CircleProperties & Omit<SystemStyleObject, keyof CircleProperties >

interface CirclePatternFn {
  (options?: CircleOptions): string
  raw: (options: CircleOptions) => CircleOptions
}


export declare const circle: CirclePatternFn;
