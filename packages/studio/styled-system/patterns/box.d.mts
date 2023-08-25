/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type BoxProperties = {}

type BoxStyles = BoxProperties & DistributiveOmit<SystemStyleObject, keyof BoxProperties>

interface BoxPatternFn {
  (styles?: BoxStyles): string
  raw: (styles: BoxStyles) => SystemStyleObject
}

export declare const box: BoxPatternFn
