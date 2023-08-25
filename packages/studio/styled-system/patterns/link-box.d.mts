/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type LinkBoxProperties = {}

type LinkBoxStyles = LinkBoxProperties & DistributiveOmit<SystemStyleObject, keyof LinkBoxProperties>

interface LinkBoxPatternFn {
  (styles?: LinkBoxStyles): string
  raw: (styles: LinkBoxStyles) => SystemStyleObject
}

export declare const linkBox: LinkBoxPatternFn
