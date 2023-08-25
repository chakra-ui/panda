/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type WrapProperties = {
  gap?: PropertyValue<'gap'>
  rowGap?: PropertyValue<'gap'>
  columnGap?: PropertyValue<'gap'>
  align?: PropertyValue<'alignItems'>
  justify?: PropertyValue<'justifyContent'>
}

type WrapStyles = WrapProperties & DistributiveOmit<SystemStyleObject, keyof WrapProperties>

interface WrapPatternFn {
  (styles?: WrapStyles): string
  raw: (styles: WrapStyles) => SystemStyleObject
}

export declare const wrap: WrapPatternFn
