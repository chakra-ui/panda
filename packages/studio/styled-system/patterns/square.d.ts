/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types'
import type { Properties } from '../types/csstype'
import type { PropertyValue } from '../types/prop-type'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens'

export type SquareProperties = {
   size?: PropertyValue<'width'>
}


type SquareStyles = SquareProperties & DistributiveOmit<SystemStyleObject, keyof SquareProperties >

interface SquarePatternFn {
  (styles?: SquareStyles): string
  raw: (styles: SquareStyles) => SquareStyles
}


export declare const square: SquarePatternFn;
