/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type AspectRatioProperties = {
   ratio?: ConditionalValue<number>
}


type AspectRatioStyles = AspectRatioProperties & DistributiveOmit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>

interface AspectRatioPatternFn {
  (styles?: AspectRatioStyles): string
  raw: (styles: AspectRatioStyles) => AspectRatioStyles
}


export declare const aspectRatio: AspectRatioPatternFn;
