/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type StackProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	gap?: PropertyValue<'gap'>
}


type StackStyles = StackProperties & DistributiveOmit<SystemStyleObject, keyof StackProperties >

interface StackPatternFn {
  (styles?: StackStyles): string
  raw: (styles: StackStyles) => StackStyles
}


export declare const stack: StackPatternFn;
