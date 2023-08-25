/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type SpacerProperties = {
  size?: ConditionalValue<Tokens['spacing']>
}

type SpacerStyles = SpacerProperties & DistributiveOmit<SystemStyleObject, keyof SpacerProperties>

interface SpacerPatternFn {
  (styles?: SpacerStyles): string
  raw: (styles: SpacerStyles) => SystemStyleObject
}

export declare const spacer: SpacerPatternFn
