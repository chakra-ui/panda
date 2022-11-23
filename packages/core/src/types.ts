import type { Dict, TransformHelpers } from '@pandacss/types'
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
  breakpoints: Record<string, string>
  helpers: TransformHelpers
  hasShorthand: boolean
  resolveShorthand: (prop: string) => string
  transform: (prop: string, value: string) => TransformResult
  hash?: boolean
}
