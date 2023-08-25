/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type SquareProperties = {
  size?: PropertyValue<'width'>
}

type SquareStyles = SquareProperties & DistributiveOmit<SystemStyleObject, keyof SquareProperties>

interface SquarePatternFn {
  (styles?: SquareStyles): string
  raw: (styles: SquareStyles) => SystemStyleObject
}

export declare const square: SquarePatternFn
