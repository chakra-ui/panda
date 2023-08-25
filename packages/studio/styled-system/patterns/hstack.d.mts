/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type HstackProperties = {
  justify?: PropertyValue<'justifyContent'>
  gap?: PropertyValue<'gap'>
}

type HstackStyles = HstackProperties & DistributiveOmit<SystemStyleObject, keyof HstackProperties>

interface HstackPatternFn {
  (styles?: HstackStyles): string
  raw: (styles: HstackStyles) => SystemStyleObject
}

export declare const hstack: HstackPatternFn
