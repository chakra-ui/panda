import type { TransformHelpers } from '@css-panda/types'
import type { Root } from 'postcss'
import type { Conditions } from './conditions'
import type { Utility } from './utility'

export type TransformResult = {
  className: string
  styles: Dict
}

export type GeneratorContext = {
  root: Root
  utility: Utility
  conditions: Conditions
  breakpoints: Record<string, string>
  helpers: TransformHelpers
  transform: (prop: string, value: string) => TransformResult
  hash?: boolean
}

export type Dict<T = any> = Record<string, T>
