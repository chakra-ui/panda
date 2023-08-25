/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type FlexProperties = {
  align?: PropertyValue<'alignItems'>
  justify?: PropertyValue<'justifyContent'>
  direction?: PropertyValue<'flexDirection'>
  wrap?: PropertyValue<'flexWrap'>
  basis?: PropertyValue<'flexBasis'>
  grow?: PropertyValue<'flexGrow'>
  shrink?: PropertyValue<'flexShrink'>
}

type FlexStyles = FlexProperties & DistributiveOmit<SystemStyleObject, keyof FlexProperties>

interface FlexPatternFn {
  (styles?: FlexStyles): string
  raw: (styles: FlexStyles) => SystemStyleObject
}

export declare const flex: FlexPatternFn
