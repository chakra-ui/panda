/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { PropertyValue } from '../types/prop-type'
import type { Properties } from '../types/csstype'
import type { Tokens } from '../tokens'

export type BleedProperties = {
   inline?: PropertyValue<'marginInline'>
	block?: PropertyValue<'marginBlock'>
}


type BleedOptions = BleedProperties & Omit<SystemStyleObject, keyof BleedProperties >

interface BleedPatternFn {
  (options?: BleedOptions): string
  raw: (options: BleedOptions) => BleedOptions
}


export declare const bleed: BleedPatternFn;
