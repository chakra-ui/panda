import type {
  Diagnostic,
  SourceTransformer,
  TransformHelperFacts,
  TransformSourceOptions,
  TransformSourceResult,
} from '@pandacss/compiler-shared'

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

export interface TransformResult {
  code: string
  map: string | null
  changed: boolean
  bailed: boolean
  diagnostics: Diagnostic[]
  dependencies: string[]
  helper: TransformHelperFacts
}

export function transformSource(
  compiler: SourceTransformer,
  path: string,
  source: string,
  options: TransformerOptions = {},
): TransformResult {
  const result: TransformSourceResult = compiler.transformSource(path, source, toNativeOptions(options))
  return {
    code: result.code,
    map: result.map,
    changed: result.changed,
    bailed: result.bailed,
    diagnostics: result.diagnostics,
    dependencies: result.dependencies,
    helper: result.helper,
  }
}

function toNativeOptions(options: TransformerOptions): TransformSourceOptions {
  return {
    mode: options.mode,
    helperCx: options.helper?.cx === true ? 'true' : options.helper?.cx === false ? 'false' : 'auto',
    targetsCss: options.targets?.css,
    targetsPatterns: options.targets?.patterns,
    targetsRecipes: options.targets?.recipes,
    targetsTokens: options.targets?.tokens,
    targetsJsx: options.targets?.jsx,
  }
}

const SOURCE_RE = /\.(c|m)?(t|j)sx?$/

export function shouldTransform(path: string, options: TransformerOptions = {}): boolean {
  const id = path.split('?')[0] ?? path
  if (!SOURCE_RE.test(id)) return false
  if (options.include && !matchesAny(id, options.include)) return false
  if (options.exclude && matchesAny(id, options.exclude)) return false
  return true
}

function matchesAny(path: string, patterns: RegExp | RegExp[]): boolean {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some((pattern) => pattern.test(path))
}
