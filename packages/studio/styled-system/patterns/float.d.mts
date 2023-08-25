/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type FloatProperties = {
  offsetX?: ConditionalValue<Tokens['spacing'] | Properties['left']>
  offsetY?: ConditionalValue<Tokens['spacing'] | Properties['top']>
  offset?: ConditionalValue<Tokens['spacing'] | Properties['top']>
  placement?: ConditionalValue<
    | 'bottom-end'
    | 'bottom-start'
    | 'top-end'
    | 'top-start'
    | 'bottom-center'
    | 'top-center'
    | 'middle-center'
    | 'middle-end'
    | 'middle-start'
  >
}

type FloatStyles = FloatProperties & DistributiveOmit<SystemStyleObject, keyof FloatProperties>

interface FloatPatternFn {
  (styles?: FloatStyles): string
  raw: (styles: FloatStyles) => SystemStyleObject
}

export declare const float: FloatPatternFn
