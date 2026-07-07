import type { Compiler, SourceTransformer } from '@pandacss/compiler-shared'
import { getInternalCssRuntimeSource, resolveCxSeparator } from './runtime/internal/load'
import { INTERNAL_CSS_RESOLVED_ID, isInternalCssImport, isInternalCssResolvedId } from './runtime/internal/ids'
import { shouldTransform, transformSource, type TransformResult, type TransformerOptions } from './transform'

export type TransformerCompiler = Compiler & SourceTransformer

export interface PandaTransformerOptions extends TransformerOptions {
  /** Resolved Panda compiler instance from `createCompiler()` or `createNodeDriver()`. */
  compiler?: TransformerCompiler
  /** Lazy compiler access for hosts that initialize the driver in `configResolved`. */
  getCompiler?: () => TransformerCompiler | undefined
}

export function resolveCompiler(options: PandaTransformerOptions): TransformerCompiler | undefined {
  return options.compiler ?? options.getCompiler?.()
}

export interface PandaSourceTransformContext {
  addWatchFile?: (file: string) => void
}

export interface PandaSourceTransformResult
  extends Pick<TransformResult, 'diagnostics' | 'dependencies' | 'changed' | 'bailed'> {
  code: string
  map: string | null
}

export function runSourceTransform(
  ctx: PandaSourceTransformContext,
  options: PandaTransformerOptions,
  code: string,
  id: string,
): PandaSourceTransformResult | null {
  if (!shouldTransform(id, options)) return null

  const compiler = resolveCompiler(options)
  if (!compiler) return null

  const result = transformSource(compiler, id, code, options)
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
