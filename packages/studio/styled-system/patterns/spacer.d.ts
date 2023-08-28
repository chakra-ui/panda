/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type SpacerProperties = {
   size?: ConditionalValue<Tokens["spacing"]>
}


type SpacerStyles = SpacerProperties & DistributiveOmit<SystemStyleObject, keyof SpacerProperties >

interface SpacerPatternFn {
  (styles?: SpacerStyles): string
  raw: (styles: SpacerStyles) => SpacerStyles
}


export declare const spacer: SpacerPatternFn;
