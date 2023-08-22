/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type AspectRatioProperties = {
   ratio?: ConditionalValue<number>
}


type AspectRatioOptions = AspectRatioProperties & Omit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>

interface AspectRatioPatternFn {
  (options?: AspectRatioOptions): string
  raw: (options: AspectRatioOptions) => AspectRatioOptions
}


export declare const aspectRatio: AspectRatioPatternFn;
