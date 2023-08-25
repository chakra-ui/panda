/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type GridProperties = {
  gap?: PropertyValue<'gap'>
  columnGap?: PropertyValue<'gap'>
  rowGap?: PropertyValue<'gap'>
  columns?: ConditionalValue<number>
  minChildWidth?: ConditionalValue<Tokens['sizes'] | Properties['width']>
}

type GridStyles = GridProperties & DistributiveOmit<SystemStyleObject, keyof GridProperties>

interface GridPatternFn {
  (styles?: GridStyles): string
  raw: (styles: GridStyles) => SystemStyleObject
}

export declare const grid: GridPatternFn
