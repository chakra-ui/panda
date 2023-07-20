/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type SpacerProperties = {
   size?: ConditionalValue<Tokens["spacing"]>
}


type SpacerOptions = SpacerProperties & Omit<SystemStyleObject, keyof SpacerProperties >

interface SpacerPatternFn {
  (options?: SpacerOptions): string
  raw: (options: SpacerOptions) => SpacerOptions
}


export declare const spacer: SpacerPatternFn;
