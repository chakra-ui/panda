/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type StyledLinkProperties = {
   
}


type StyledLinkOptions = StyledLinkProperties & Omit<SystemStyleObject, keyof StyledLinkProperties >

interface StyledLinkPatternFn {
  (options?: StyledLinkOptions & { css?: SystemStyleObject }): string
  raw: (options: StyledLinkOptions) => StyledLinkOptions
}


export declare const styledLink: StyledLinkPatternFn;
