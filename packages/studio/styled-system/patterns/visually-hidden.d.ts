/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type VisuallyHiddenProperties = {
   
}


type VisuallyHiddenOptions = VisuallyHiddenProperties & Omit<SystemStyleObject, keyof VisuallyHiddenProperties >

interface VisuallyHiddenPatternFn {
  (options?: VisuallyHiddenOptions): string
  raw: (options: VisuallyHiddenOptions) => VisuallyHiddenOptions
}


export declare const visuallyHidden: VisuallyHiddenPatternFn;
