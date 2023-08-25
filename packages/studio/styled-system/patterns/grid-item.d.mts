/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index.d.mts'
import type { Properties } from '../types/csstype.d.mts'
import type { PropertyValue } from '../types/prop-type.d.mts'
import type { DistributiveOmit } from '../types/system-types.d.mts'
import type { Token } from '../tokens/index.d.mts'

export type GridItemProperties = {
  colSpan?: ConditionalValue<number>
  rowSpan?: ConditionalValue<number>
  colStart?: ConditionalValue<number>
  rowStart?: ConditionalValue<number>
  colEnd?: ConditionalValue<number>
  rowEnd?: ConditionalValue<number>
}

type GridItemStyles = GridItemProperties & DistributiveOmit<SystemStyleObject, keyof GridItemProperties>

interface GridItemPatternFn {
  (styles?: GridItemStyles): string
  raw: (styles: GridItemStyles) => SystemStyleObject
}

export declare const gridItem: GridItemPatternFn
