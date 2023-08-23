/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type BleedProperties = {
   inline?: PropertyValue<'marginInline'>
	block?: PropertyValue<'marginBlock'>
}


type BleedStyles = BleedProperties & DistributiveOmit<SystemStyleObject, keyof BleedProperties >

interface BleedPatternFn {
  (styles?: BleedStyles): string
  raw: (styles: BleedStyles) => BleedStyles
}


export declare const bleed: BleedPatternFn;
