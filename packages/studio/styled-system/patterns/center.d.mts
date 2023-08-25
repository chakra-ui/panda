/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type CenterProperties = {
  inline?: ConditionalValue<boolean>
}

type CenterStyles = CenterProperties & DistributiveOmit<SystemStyleObject, keyof CenterProperties>

interface CenterPatternFn {
  (styles?: CenterStyles): string
  raw: (styles: CenterStyles) => SystemStyleObject
}

export declare const center: CenterPatternFn
