/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type StyledLinkProperties = {}

type StyledLinkStyles = StyledLinkProperties & DistributiveOmit<SystemStyleObject, keyof StyledLinkProperties>

interface StyledLinkPatternFn {
  (styles?: StyledLinkStyles): string
  raw: (styles: StyledLinkStyles) => SystemStyleObject
}

export declare const styledLink: StyledLinkPatternFn
