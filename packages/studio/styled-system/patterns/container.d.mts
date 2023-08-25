/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type ContainerProperties = {}

type ContainerStyles = ContainerProperties & DistributiveOmit<SystemStyleObject, keyof ContainerProperties>

interface ContainerPatternFn {
  (styles?: ContainerStyles): string
  raw: (styles: ContainerStyles) => SystemStyleObject
}

export declare const container: ContainerPatternFn
