/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type VisuallyHiddenProperties = {}

type VisuallyHiddenStyles = VisuallyHiddenProperties &
  DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties>

interface VisuallyHiddenPatternFn {
  (styles?: VisuallyHiddenStyles): string
  raw: (styles: VisuallyHiddenStyles) => SystemStyleObject
}

export declare const visuallyHidden: VisuallyHiddenPatternFn
