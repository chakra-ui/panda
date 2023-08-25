/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type LinkOverlayProperties = {}

type LinkOverlayStyles = LinkOverlayProperties & DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties>

interface LinkOverlayPatternFn {
  (styles?: LinkOverlayStyles): string
  raw: (styles: LinkOverlayStyles) => SystemStyleObject
}

export declare const linkOverlay: LinkOverlayPatternFn
