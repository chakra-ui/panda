import { mergeConfigs } from '@pandacss/config/merge'
import { createConfigSnapshot } from '@pandacss/config/serialize'
import type { FileInspectionResult, TokenSuggestion } from '@pandacss/compiler-shared'
import presetBase from '@pandacss/preset-base'
import type { DesignSystemSpec } from './design-system'
import { specToConfig } from './spec-config'

let wasmModule: unknown | null = null
async function loadWasmModule(): Promise<unknown> {
  if (wasmModule) return wasmModule
  const [{ default: init, ...mod }, wasmUrl] = await Promise.all([
    import('@pandacss/compiler-wasm/pkg-web/compiler_wasm.js'),
    import('@pandacss/compiler-wasm/pkg-web/compiler_wasm_bg.wasm?url').then((m) => m.default),
  ])
  await init(wasmUrl)
  wasmModule = mod
  return mod
}

export interface InspectingCompiler {
  inspectFileSource: (path: string, source: string) => Omit<FileInspectionResult, 'path'>
  suggestTokens: (prop: string, value: string) => TokenSuggestion[]
  config: () => Record<string, unknown> | null
  spec: () => unknown
}

async function createCompiler(merged: unknown): Promise<InspectingCompiler> {
  const { build } = await import('@pandacss/compiler-wasm/web')
  const mod = await loadWasmModule()
  const snapshot = createConfigSnapshot(merged as never)
  return (build as (m: unknown, c: unknown, cb: unknown, h?: unknown) => never)(
    mod,
    (snapshot as { config: unknown }).config,
    (snapshot as { callbacks?: unknown }).callbacks ?? {},
    (snapshot as { hooks?: unknown }).hooks,
  ) as InspectingCompiler
}

const compilers = new WeakMap<DesignSystemSpec, Promise<InspectingCompiler>>()

/** A compiler for a system known only by its spec: tokens from the spec, utilities from the base preset. */
export function createCompilerFromSpec(spec: DesignSystemSpec): Promise<InspectingCompiler> {
  let compiler = compilers.get(spec)
  if (!compiler) {
    compiler = createCompiler(mergeConfigs([presetBase, specToConfig(spec)] as never))
    compilers.set(spec, compiler)
  }
  return compiler
}
