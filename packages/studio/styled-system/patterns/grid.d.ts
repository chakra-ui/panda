/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type GridProperties = {
   gap?: PropertyValue<'gap'>
	columnGap?: PropertyValue<'gap'>
	rowGap?: PropertyValue<'gap'>
	columns?: ConditionalValue<number>
	minChildWidth?: ConditionalValue<Tokens["sizes"] | Properties["width"]>
}


type GridStyles = GridProperties & DistributiveOmit<SystemStyleObject, keyof GridProperties >

interface GridPatternFn {
  (styles?: GridStyles): string
  raw: (styles: GridStyles) => GridStyles
}


export declare const grid: GridPatternFn;
