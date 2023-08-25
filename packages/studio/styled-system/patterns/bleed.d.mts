/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type BleedProperties = {
  inline?: PropertyValue<'marginInline'>
  block?: PropertyValue<'marginBlock'>
}

type BleedStyles = BleedProperties & DistributiveOmit<SystemStyleObject, keyof BleedProperties>

interface BleedPatternFn {
  (styles?: BleedStyles): string
  raw: (styles: BleedStyles) => SystemStyleObject
}

export declare const bleed: BleedPatternFn
