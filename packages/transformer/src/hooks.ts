import type {
  Compiler,
  PandaSourceTransformContext,
  PandaSourceTransformResult,
  PandaTransformerOptions,
  SourceTransformer,
} from '@pandacss/compiler-shared'
import { getInternalCssRuntimeSource, resolveCxSeparator } from './runtime/internal/load'
import { INTERNAL_CSS_RESOLVED_ID, isInternalCssImport, isInternalCssResolvedId } from './runtime/internal/ids'
import { createSourceTransformer, shouldTransform, transformSource } from './transform'
export type {
  PandaSourceTransformContext,
  PandaSourceTransformResult,
  PandaTransformerOptions,
} from '@pandacss/compiler-shared'

export function resolveCompiler(options: PandaTransformerOptions): Compiler | undefined {
  return options.compiler ?? options.getCompiler?.() ?? resolveTransformer(options)?.compiler
}

export function resolveTransformer(options: PandaTransformerOptions): SourceTransformer | undefined {
  const transformer = options.transformer ?? options.getTransformer?.()
  if (transformer) return transformer

  const compiler = options.compiler ?? options.getCompiler?.()
  return compiler ? createSourceTransformer(compiler) : undefined
}

export function runSourceTransform(
  ctx: PandaSourceTransformContext,
  options: PandaTransformerOptions,
  code: string,
  id: string,
): PandaSourceTransformResult | null {
  if (!shouldTransform(id, options)) return null

  const transformer = resolveTransformer(options)
  if (!transformer) return null

  const {
    compiler: _compiler,
    getCompiler: _getCompiler,
    getTransformer: _getTransformer,
    transformer: _transformer,
    ...transformOptions
  } = options
  const result = transformSource({ ...transformOptions, transformer, path: id, source: code })
  for (const dep of result.dependencies) {
    ctx.addWatchFile?.(dep)
  }

  if (!result.changed) return null

  return {
    code: result.code,
    map: result.map,
    diagnostics: result.diagnostics,
    dependencies: result.dependencies,
    changed: result.changed,
    bailed: result.bailed,
  }
}

export function createPandaSourcePluginHooks(resolveOptions: () => PandaTransformerOptions) {
  return {
    resolveId(id: string) {
      if (isInternalCssImport(id)) {
        return INTERNAL_CSS_RESOLVED_ID
      }
      return null
    },

    load(id: string) {
      if (!isInternalCssResolvedId(id)) return null
      const compiler = resolveCompiler(resolveOptions())
      return getInternalCssRuntimeSource(resolveCxSeparator(compiler?.config()))
    },

    transform(this: PandaSourceTransformContext, code: string, id: string) {
      return runSourceTransform(this, resolveOptions(), code, id)
    },
  }
}
