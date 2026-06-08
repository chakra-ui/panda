import type {
  BuildInfoNative,
  Compiler,
  CompileOutput,
  CompilerOptions,
  ConfigSnapshot,
  ProjectCallbacks,
  SerializedConfig,
} from '@pandacss/compiler-shared'
import {
  assertProjectCallbacks,
  getTokenCategoryValues,
  makeBuildInfoApi,
  mergeCallbacks,
} from '@pandacss/compiler-shared'
import { registerCallbacks } from './callbacks'
import { fallback } from './fallback'
import { loadNativeBinding } from './load-binary'
import type { CompileInput, NativeCompilerOptions, TokenDictionary, TraceOptions } from './types'

export type * from '@pandacss/compiler-shared'
export type * from './types'

export { createNodeDriver } from './driver'
export type { NodeDriverOptions } from './driver'

const binding = loadNativeBinding() ?? fallback
const nativeCompilerFromConfig =
  'fromConfig' in binding.Compiler && typeof binding.Compiler.fromConfig === 'function'
    ? binding.Compiler.fromConfig.bind(binding.Compiler)
    : undefined

/** One-shot stateless compile: build a compiler from `config`, parse every
 *  input file, and emit the stylesheet. Callback-bearing configs
 *  (`utilities.*.transform`, `patterns.*.transform`) are *not* supported here —
 *  use [`createCompiler`] + `options.callbacks` for those. */
export function compile(input?: CompileInput): CompileOutput {
  return binding.compile(input)
}

export function startTracing(options?: TraceOptions): boolean {
  return binding.startTracing?.(options) ?? false
}

export function flushTracing(): void {
  binding.flushTracing?.()
}

export function shutdownTracing(): boolean {
  return binding.shutdownTracing?.() ?? false
}

export function createCompiler(config: SerializedConfig, options?: CompilerOptions): Compiler {
  return build(config, options?.callbacks ?? {}, options)
}

/** Like {@link createCompiler}, but takes a snapshot; its callbacks merge under
 *  any in `options.callbacks`. */
export function createCompilerFromSnapshot(snapshot: ConfigSnapshot, options?: CompilerOptions): Compiler {
  const callbacks = mergeCallbacks(snapshot.callbacks, options?.callbacks)
  return build(snapshot.config, callbacks, options)
}

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}

function build(config: SerializedConfig, callbacks: ProjectCallbacks, options?: CompilerOptions): Compiler {
  assertProjectCallbacks(config, callbacks)

  if (!nativeCompilerFromConfig) {
    throw new Error('createCompiler is not available in this binding')
  }

  const compiler = nativeCompilerFromConfig(config, toNativeOptions(options), createUtilityValuesCallbacks(callbacks))
  registerCallbacks(compiler, callbacks, compiler.token_dictionary?.())
  attachBuildInfo(compiler)

  return compiler
}

/** Wire the ergonomic `compiler.buildInfo` namespace over the native primitives.
 *  Non-enumerable so it doesn't surface in snapshots of the native instance. */
function attachBuildInfo(compiler: Compiler): void {
  Object.defineProperty(compiler, 'buildInfo', {
    value: makeBuildInfoApi(compiler as unknown as BuildInfoNative),
    enumerable: false,
  })
}

function toNativeOptions(options: CompilerOptions | undefined): NativeCompilerOptions | undefined {
  if (!options || options.crossFile === undefined) return undefined
  return { crossFile: options.crossFile }
}

function createUtilityValuesCallbacks(
  callbacks: ProjectCallbacks,
): Record<string, (tokenDictionary: TokenDictionary | undefined) => unknown> | undefined {
  const utilityValues = callbacks['utility.values']
  if (!utilityValues || Object.keys(utilityValues).length === 0) return undefined

  return Object.fromEntries(
    Object.entries(utilityValues).map(([id, callback]) => [
      id,
      (tokenDictionary: TokenDictionary | undefined) =>
        callback((category: string) => getTokenCategoryValues(category, tokenDictionary)),
    ]),
  )
}
