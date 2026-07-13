import type { Compiler } from './compiler'
import type { Diagnostic } from './diagnostics'

export interface TransformSourceOptions {
  mode?: 'build' | 'serve'
  helperCx?: 'auto' | 'true' | 'false'
  targetsCss?: boolean
  targetsPatterns?: boolean
  targetsRecipes?: boolean
  targetsTokens?: boolean
  targetsJsx?: boolean
}

export interface TransformHelperFacts {
  needsCx: boolean
  needsCva: boolean
  needsSva: boolean
}

export interface TransformSourceResult {
  code: string
  map: string | null
  changed: boolean
  bailed: boolean
  diagnostics: Diagnostic[]
  dependencies: string[]
  helper: TransformHelperFacts
}

export interface NativeSourceTransformer {
  transformSource(input: NativeTransformSourceInput): TransformSourceResult
}

export interface NativeTransformSourceInput extends TransformSourceOptions {
  path: string
  source: string
}

export interface TransformerOptions {
  mode?: 'build' | 'serve'
  helper?: {
    cx?: false | true | 'auto'
  }
  targets?: {
    css?: boolean
    patterns?: boolean
    recipes?: boolean
    tokens?: boolean
    jsx?: boolean
  }
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
}

export type TransformResult = TransformSourceResult

export interface TransformSourceInput extends TransformerOptions {
  path: string
  source: string
}

export interface SourceTransformer {
  readonly compiler?: Compiler
  transformSource(input: TransformSourceInput): TransformResult
}

export interface TransformSourceRequest extends TransformSourceInput {
  compiler?: Compiler
  transformer?: SourceTransformer
}

export interface PandaTransformerOptions extends TransformerOptions {
  compiler?: Compiler
  transformer?: SourceTransformer
  getCompiler?: () => Compiler | undefined
  getTransformer?: () => SourceTransformer | undefined
}

export interface PandaSourceTransformContext {
  addWatchFile?: (file: string) => void
}

export interface PandaSourceTransformResult
  extends Pick<TransformResult, 'diagnostics' | 'dependencies' | 'changed' | 'bailed'> {
  code: string
  map: string | null
}
