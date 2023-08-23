/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type CircleProperties = {
   size?: PropertyValue<'width'>
}


type CircleStyles = CircleProperties & DistributiveOmit<SystemStyleObject, keyof CircleProperties >

interface CirclePatternFn {
  (styles?: CircleStyles): string
  raw: (styles: CircleStyles) => CircleStyles
}


export declare const circle: CirclePatternFn;
