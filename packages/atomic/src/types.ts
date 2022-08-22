import { Conditions } from '@css-panda/types'
import { CSSCondition } from './css-condition'
import { Root } from 'postcss'

export type TransformResult = {
  className: string
  styles: Dict
}

export type GeneratorContext = {
  root: Root
  conditions: Conditions
  _conditions: CSSCondition
  breakpoints: Record<string, string>
  transform: (prop: string, value: string) => TransformResult
}

export type Dict<T = any> = Record<string, T>
