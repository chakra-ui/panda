/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type CircleProperties = {
  size?: PropertyValue<'width'>
}

type CircleStyles = CircleProperties & DistributiveOmit<SystemStyleObject, keyof CircleProperties>

interface CirclePatternFn {
  (styles?: CircleStyles): string
  raw: (styles: CircleStyles) => SystemStyleObject
}

export declare const circle: CirclePatternFn
