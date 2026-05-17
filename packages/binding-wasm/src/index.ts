/**
 * `@pandacss/binding-wasm` — WebAssembly binding for the Panda Rust engine.
 *
 * Two output targets are bundled:
 * - `./pkg-node/*` — CommonJS, for Node / Vitest / SSR.
 * - `./pkg-web/*` — ESM with `fetch`-based init, for browser playgrounds.
 *
 * Consumers in Node should `import { createExtractor } from '@pandacss/binding-wasm'`.
 * Browser consumers should call `init()` first (returns a promise), then construct
 * a `WasmFileSystem` + `WasmExtractor`.
 */

import type {
  Atom,
  WasmExtractor as WasmExtractorClass,
  WasmFileSystem as WasmFileSystemClass,
  WasmProject as WasmProjectClass,
  WasmProjectCallbackKind,
  WasmProjectCallbacks,
  WasmProjectOptions,
  WasmConfigSnapshot,
} from './types'

export type {
  Atom,
  FileReport,
  MatcherInput,
  MatchersInput,
  ProjectSummary,
  RecipeEntry,
  TokenDictionaryInput,
  WasmConfigSnapshot,
  WasmProjectCallbacks,
  WasmProjectOptions,
} from './types'
export type WasmFileSystem = WasmFileSystemClass
export type WasmExtractor = WasmExtractorClass
export type WasmProject = WasmProjectClass

export interface GlobOptions {
  include: string[]
  exclude?: string[]
  cwd?: string
  absolute?: boolean
}

export interface ExtractedCall {
  category: 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'
  name: string
  alias: string
  data: Array<unknown | null>
  span: { start: number; end: number }
}

export interface ExtractedJsx {
  category: 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'
  name: string
  alias: string
  data: unknown
  span: { start: number; end: number }
}

export interface Diagnostic {
  message: string
  severity: 'error' | 'warning'
  span?: { start: number; end: number }
  location?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ExtractUsage {
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/**
 * Load the Node-targeted wasm module. Idempotent — a single shared
 * binding handle is cached after first call.
 *
 * Node consumers (Vitest, SSR) should prefer this entrypoint. For
 * browser, use the `./pkg-web/*` exports directly with `init()`.
 */
interface WasmModule {
  WasmFileSystem: new () => WasmFileSystem
  WasmExtractor: new (fs: WasmFileSystem, matchers: unknown) => WasmExtractor
  WasmProject: {
    new (fs: WasmFileSystem, matchers: unknown, options?: WasmProjectOptions): WasmProject
    fromConfig(fs: WasmFileSystem, config: Record<string, unknown>, options?: WasmProjectOptions): WasmProject
  }
  installPanicHook: () => void
}

export async function loadWasm(): Promise<WasmModule> {
  if (cached) return cached
  // pkg-node ships CommonJS that auto-initializes the wasm module on require.
  const mod = (await import('../pkg-node/binding_wasm.js')) as any
  cached = mod
  if (typeof mod.installPanicHook === 'function') {
    mod.installPanicHook()
  }
  return mod
}

let cached: WasmModule | null = null

/**
 * Convenience factory: load wasm, create an FS, create an extractor.
 * Most Node-side callers want this; advanced callers can call `loadWasm()`
 * and construct the classes themselves.
 */
export async function createExtractor(matchers: import('./types').MatchersInput): Promise<{
  fs: WasmFileSystem
  extractor: WasmExtractor
}> {
  const { WasmFileSystem: FS, WasmExtractor: EX } = await loadWasm()
  const fs = new FS()
  const extractor = new EX(fs, matchers as unknown)
  return { fs, extractor }
}

/**
 * Convenience factory for the stateful `WasmProject`. Holds a per-file
 * atom registry; cross-file resolution shares the returned FS handle.
 */
export async function createProject(
  matchers: import('./types').MatchersInput,
  options?: WasmProjectOptions,
): Promise<{ fs: WasmFileSystem; project: WasmProject }> {
  const { WasmFileSystem: FS, WasmProject: P } = await loadWasm()
  const fs = new FS()
  const nativeOptions = stripProjectCallbacks(options)
  const project = new P(fs, matchers as unknown, nativeOptions)
  return { fs, project: wrapProjectCallbacks(project, options) }
}

/**
 * Convenience factory for config-derived projects. This mirrors
 * `@pandacss/binding`'s `Project.fromConfig` path so callers don't have to
 * construct matchers by hand.
 */
export async function createProjectFromConfig(
  configOrSnapshot: Record<string, unknown> | WasmConfigSnapshot,
  options?: WasmProjectOptions,
): Promise<{ fs: WasmFileSystem; project: WasmProject }> {
  const { WasmFileSystem: FS, WasmProject: P } = await loadWasm()
  const fs = new FS()
  const { config, callbacks } = normalizeProjectConfigInput(configOrSnapshot, options)
  const nativeOptions = stripProjectCallbacks(options)
  const project = P.fromConfig(fs, config, nativeOptions)
  return { fs, project: wrapProjectCallbacks(project, { ...options, config, callbacks }) }
}

function stripProjectCallbacks(options: WasmProjectOptions | undefined): WasmProjectOptions | undefined {
  if (!options) return undefined
  const { callbacks: _callbacks, config: _config, ...rest } = options
  return rest
}

function normalizeProjectConfigInput(
  input: Record<string, unknown> | WasmConfigSnapshot,
  options?: WasmProjectOptions,
): { config: Record<string, unknown>; callbacks: WasmProjectCallbacks } {
  if (isConfigSnapshot(input)) {
    return {
      config: input.config,
      callbacks: mergeCallbacks(input.callbacks, options?.callbacks),
    }
  }
  return {
    config: input,
    callbacks: options?.callbacks ?? {},
  }
}

function isConfigSnapshot(value: Record<string, unknown> | WasmConfigSnapshot): value is WasmConfigSnapshot {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'config' in value &&
    !!(value as WasmConfigSnapshot).config &&
    typeof (value as WasmConfigSnapshot).config === 'object' &&
    !Array.isArray((value as WasmConfigSnapshot).config)
  )
}

function mergeCallbacks(...items: Array<WasmProjectCallbacks | undefined>): WasmProjectCallbacks {
  const result: WasmProjectCallbacks = {}
  for (const item of items) {
    for (const [kind, callbacks] of Object.entries(item ?? {}) as Array<
      [WasmProjectCallbackKind, Record<string, Function>]
    >) {
      result[kind] = { ...result[kind], ...callbacks } as Record<string, (...args: any[]) => unknown>
    }
  }
  return result
}

function wrapProjectCallbacks(project: WasmProject, options: WasmProjectOptions | undefined): WasmProject {
  const callbacks = options?.callbacks
  const config = options?.config
  if (!callbacks?.['utility.transform'] || Object.keys(callbacks['utility.transform']).length === 0 || !config) {
    return project
  }
  const utilityTransformCache = new Map<string, Atom[]>()

  return {
    config: () => project.config(),
    parseFile: (path, source) => project.parseFile(path, source),
    refreshFile: (path, source) => project.refreshFile(path, source),
    removeFile: (path) => project.removeFile(path),
    clear: () => {
      utilityTransformCache.clear()
      project.clear()
    },
    isEmpty: () => project.isEmpty(),
    atoms: () => applyUtilityTransformCallbacks(project.atoms(), config, callbacks, utilityTransformCache),
    recipes: () => project.recipes(),
    slotRecipes: () => project.slotRecipes(),
    summary: () => project.summary(),
  } as WasmProject
}

function applyUtilityTransformCallbacks(
  atoms: Atom[],
  config: Record<string, unknown>,
  callbacks: WasmProjectCallbacks,
  cache: Map<string, Atom[]>,
): Atom[] {
  const transforms = callbacks['utility.transform']
  if (!transforms) return atoms

  const utilityTransforms = getUtilityTransformRefs(config)
  if (utilityTransforms.size === 0) return atoms

  return atoms.flatMap((atom) => {
    const id = utilityTransforms.get(atom.prop)
    const transform = id ? transforms[id] : undefined
    if (!transform) return [atom]

    const cacheKey = `${id}\0${atom.prop}\0${JSON.stringify(atom.value)}`
    const cached = cache.get(cacheKey)
    if (cached) return applyConditions(cached, atom.conditions)

    const result = transform(atom.value, {
      raw: atom.value,
      token: Object.assign(() => undefined, { raw: () => undefined }),
      utils: {
        colorMix: (value: string) => ({ invalid: true, value }),
      },
    })

    if (!result || typeof result !== 'object' || Array.isArray(result)) return []
    const transformed = styleObjectToAtoms(result as Record<string, unknown>, [])
    cache.set(cacheKey, transformed)
    return applyConditions(transformed, atom.conditions)
  })
}

function getUtilityTransformRefs(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  const utilities = config.utilities
  if (!utilities || typeof utilities !== 'object' || Array.isArray(utilities)) return refs

  for (const [prop, utility] of Object.entries(utilities as Record<string, unknown>)) {
    if (!utility || typeof utility !== 'object' || Array.isArray(utility)) continue
    const transform = (utility as Record<string, unknown>).transform
    if (isCallbackRef(transform)) refs.set(prop, transform.id)
  }

  return refs
}

function isCallbackRef(value: unknown): value is { kind: 'js-callback'; id: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).kind === 'js-callback' &&
    typeof (value as Record<string, unknown>).id === 'string'
  )
}

function styleObjectToAtoms(style: Record<string, unknown>, baseConditions: string[]): Atom[] {
  const atoms: Atom[] = []
  walkStyle(style, [], baseConditions, atoms)
  return atoms.sort(compareAtoms)
}

function walkStyle(value: unknown, path: string[], baseConditions: string[], atoms: Atom[]) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      walkStyle(child, path.concat(key), baseConditions, atoms)
    }
    return
  }

  const prop = path[0]
  if (!prop) return
  atoms.push({
    prop,
    value: normalizeAtomValue(value),
    conditions: [...baseConditions],
  })
}

function normalizeAtomValue(value: unknown): Atom['value'] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)
    return value
  if (Array.isArray(value)) return `[${value.join(',')}]`
  return String(value)
}

function applyConditions(atoms: Atom[], conditions: string[]): Atom[] {
  if (conditions.length === 0) return atoms
  return atoms.map((atom) => ({ ...atom, conditions: [...conditions] }))
}

function compareAtoms(a: Atom, b: Atom) {
  return (
    a.prop.localeCompare(b.prop) ||
    a.conditions.join('\0').localeCompare(b.conditions.join('\0')) ||
    String(a.value).localeCompare(String(b.value))
  )
}
