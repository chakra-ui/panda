/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type LinkBoxProperties = {
   
}


type LinkBoxStyles = LinkBoxProperties & DistributiveOmit<SystemStyleObject, keyof LinkBoxProperties >

interface LinkBoxPatternFn {
  (styles?: LinkBoxStyles): string
  raw: (styles: LinkBoxStyles) => LinkBoxStyles
}


export declare const linkBox: LinkBoxPatternFn;
