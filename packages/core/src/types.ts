import type { Dict, PatternHelpers } from '@pandacss/types'
import type { Root } from 'postcss'
import type { Conditions } from './conditions'
import type { Utility } from './utility'

export type TransformResult = {
  layer?: string
  className: string
  styles: Dict
}

export type StylesheetContext = {
  root: Root
  utility: Utility
  conditions: Conditions
  helpers: PatternHelpers
  hash?: boolean
  transform?: (prop: string, value: any) => TransformResult
}
