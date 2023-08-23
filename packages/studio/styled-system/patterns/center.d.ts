/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type CenterProperties = {
   inline?: ConditionalValue<boolean>
}


type CenterStyles = CenterProperties & DistributiveOmit<SystemStyleObject, keyof CenterProperties >

interface CenterPatternFn {
  (styles?: CenterStyles): string
  raw: (styles: CenterStyles) => CenterStyles
}


export declare const center: CenterPatternFn;
