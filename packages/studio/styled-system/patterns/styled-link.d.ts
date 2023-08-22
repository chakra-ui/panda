/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type StyledLinkProperties = {
   
}


type StyledLinkStyles = StyledLinkProperties & DistributiveOmit<SystemStyleObject, keyof StyledLinkProperties >

interface StyledLinkPatternFn {
  (styles?: StyledLinkStyles): string
  raw: (styles: StyledLinkStyles) => StyledLinkStyles
}


export declare const styledLink: StyledLinkPatternFn;
