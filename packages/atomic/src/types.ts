import { Conditions } from '@css-panda/types'
import { Root } from 'postcss'

export type TransformResult = {
  className: string
  styles: Dict
}

export type GeneratorContext = {
  root: Root
  conditions: Conditions
  breakpoints: Record<string, string>
  transform: (prop: string, value: string) => TransformResult
}

export type Dict<T = any> = Record<string, T>
