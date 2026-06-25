import type {
  Compiler,
  CompileOutput,
  CompilerOptions,
  ConfigSnapshot,
  DesignSystemBinding,
  ProjectCallbacks,
  SerializedConfig,
} from '@pandacss/compiler-shared'
import {
  assertProjectHooks,
  assertProjectCallbacks,
  BuildInfo,
  DesignSystem,
  getTokenCategoryValues,
  mergeCallbacks,
  mergeHooks,
  prepareCompilerConfig,
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

/**
 * One-shot stateless compile: build a compiler from `config`, parse every
 * input file, and emit the stylesheet. Callback-bearing configs
 * (`utilities.*.transform`, `patterns.*.transform`) are *not* supported here -
 * use [`createCompiler`] + `options.callbacks` for those.
 */
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

/**
 * Like {@link createCompiler}, but takes a snapshot; its callbacks merge under
 * any in `options.callbacks`.
 */
export function createCompilerFromSnapshot(snapshot: ConfigSnapshot, options?: CompilerOptions): Compiler {
  const callbacks = mergeCallbacks(snapshot.callbacks, options?.callbacks)
  const hooks = mergeHooks(snapshot.hooks, options?.hooks)
  return build(snapshot.config, callbacks, { ...options, hooks })
}

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}

function build(config: SerializedConfig, callbacks: ProjectCallbacks, options?: CompilerOptions): Compiler {
  assertProjectCallbacks(config, callbacks)
  assertProjectHooks(options?.hooks, callbacks)

  if (!nativeCompilerFromConfig) {
    throw new Error('createCompiler is not available in this binding')
  }

  const prepared = prepareCompilerConfig(config)
  const compiler = nativeCompilerFromConfig(prepared, toNativeOptions(options), createUtilityValuesCallbacks(callbacks))
  registerCallbacks(compiler, callbacks, options?.hooks, compiler.token_dictionary?.())
  attachBuildInfo(compiler)
  attachDesignSystem(compiler)

  return compiler
}

/**
 * Wire the ergonomic `compiler.buildInfo` namespace over the native primitives.
 * Non-enumerable so it doesn't surface in snapshots of the native instance, and
 * lazy - the API is built on first access, then cached in place.
 */
function attachBuildInfo(compiler: ReturnType<NonNullable<typeof nativeCompilerFromConfig>>): void {
  Object.defineProperty(compiler, 'buildInfo', {
    enumerable: false,
    configurable: true,
    get() {
      const api = new BuildInfo(compiler)
      Object.defineProperty(compiler, 'buildInfo', {
        value: api,
        enumerable: false,
        configurable: true,
      })
      return api
    },
  })
}

/**
 * Wire `compiler.designSystem` over the native primitives; non-enumerable and
 * lazy, mirroring `buildInfo`. `designSystem.load` reuses the `buildInfo`
 * namespace (accessing it here triggers its own lazy build).
 */
function attachDesignSystem(compiler: ReturnType<NonNullable<typeof nativeCompilerFromConfig>>): void {
  Object.defineProperty(compiler, 'designSystem', {
    enumerable: false,
    configurable: true,
    get() {
      const api = new DesignSystem(toDesignSystemBinding(compiler), compiler.buildInfo)
      Object.defineProperty(compiler, 'designSystem', {
        value: api,
        enumerable: false,
        configurable: true,
      })
      return api
    },
  })
}

function toDesignSystemBinding(
  compiler: ReturnType<NonNullable<typeof nativeCompilerFromConfig>>,
): DesignSystemBinding {
  return {
    createManifest: (input) => compiler.createDesignSystemManifest(input),
    manifestSchemaVersion: () => compiler.designSystemManifestSchemaVersion(),
    resolveChain: (manifests) => compiler.resolveDesignSystemChain(manifests),
  }
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
