/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type AspectRatioProperties = {
  ratio?: ConditionalValue<number>
}

type AspectRatioStyles = AspectRatioProperties &
  DistributiveOmit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>

interface AspectRatioPatternFn {
  (styles?: AspectRatioStyles): string
  raw: (styles: AspectRatioStyles) => SystemStyleObject
}

export declare const aspectRatio: AspectRatioPatternFn
