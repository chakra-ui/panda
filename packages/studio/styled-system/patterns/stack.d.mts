/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type StackProperties = {
  align?: PropertyValue<'alignItems'>
  justify?: PropertyValue<'justifyContent'>
  direction?: PropertyValue<'flexDirection'>
  gap?: PropertyValue<'gap'>
}

type StackStyles = StackProperties & DistributiveOmit<SystemStyleObject, keyof StackProperties>

interface StackPatternFn {
  (styles?: StackStyles): string
  raw: (styles: StackStyles) => SystemStyleObject
}

export declare const stack: StackPatternFn
