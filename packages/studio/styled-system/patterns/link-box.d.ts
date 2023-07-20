/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type LinkBoxProperties = {
   
}


type LinkBoxOptions = LinkBoxProperties & Omit<SystemStyleObject, keyof LinkBoxProperties >

interface LinkBoxPatternFn {
  (options?: LinkBoxOptions): string
  raw: (options: LinkBoxOptions) => LinkBoxOptions
}


export declare const linkBox: LinkBoxPatternFn;
