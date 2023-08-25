/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type VstackProperties = {
  justify?: PropertyValue<'justifyContent'>
  gap?: PropertyValue<'gap'>
}

type VstackStyles = VstackProperties & DistributiveOmit<SystemStyleObject, keyof VstackProperties>

interface VstackPatternFn {
  (styles?: VstackStyles): string
  raw: (styles: VstackStyles) => SystemStyleObject
}

export declare const vstack: VstackPatternFn
