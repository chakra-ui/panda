import type {
  Compiler,
  SourceTransformer,
  TransformResult,
  TransformSourceInput,
  NativeTransformSourceInput,
  TransformSourceOptions,
  TransformSourceRequest,
  TransformSourceResult,
  TransformerOptions,
} from '@pandacss/compiler-shared'
export type {
  SourceTransformer,
  TransformResult,
  TransformSourceInput,
  TransformSourceRequest,
  TransformerOptions,
} from '@pandacss/compiler-shared'

interface RawSourceTransformBinding {
  transformSource(input: NativeTransformSourceInput): TransformSourceResult
}

export function createSourceTransformer(compiler: Compiler): SourceTransformer {
  const binding = compiler as unknown as Partial<RawSourceTransformBinding>
  return {
    compiler,
    transformSource(input) {
      if (typeof binding.transformSource !== 'function') {
        throw new Error('Source transforms are not available for this compiler instance')
      }
      return normalizeResult(binding.transformSource(toNativeInput(input)))
    },
  }
}

export function transformSource(input: TransformSourceRequest): TransformResult {
  const transformer = input.transformer ?? (input.compiler ? createSourceTransformer(input.compiler) : undefined)
  if (!transformer) {
    throw new Error('Source transforms require a compiler or source transformer')
  }
  return transformer.transformSource(input)
}

function normalizeResult(result: TransformSourceResult): TransformResult {
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

function toNativeInput(input: TransformSourceInput): NativeTransformSourceInput {
  return {
    path: input.path,
    source: input.source,
    ...toNativeOptions(input),
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
