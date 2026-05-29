import type {
  Atom,
  Compiler,
  CompileOutput,
  CompilerOptions,
  ConfigSnapshot,
  Diagnostic,
  ExtractedCall,
  ExtractedJsx,
  ExtractResult,
  MatchCategory,
  ProjectCallbacks,
  SerializedConfig,
  Span,
} from '@pandacss/compiler-shared'
import { assertProjectCallbacks, getTokenCategoryValues, mergeCallbacks } from '@pandacss/compiler-shared'
import { registerCallbacks } from './callbacks'
import { loadNativeBinding } from './load-binary'

export type * from '@pandacss/compiler-shared'

export interface CompileInput {
  files?: Array<{ path: string; content: string }>
  config?: SerializedConfig
  cwd?: string
  cacheDir?: string
}

export type ImportSpecifierKind = 'named' | 'default' | 'namespace'

export interface ImportSpecifier {
  kind: ImportSpecifierKind
  imported: string
  local: string
  typeOnly: boolean
  span: Span
}

export type ImportKind = 'sideEffect' | 'value'

export interface ImportRecord {
  module: string
  kind: ImportKind
  typeOnly: boolean
  specifiers: ImportSpecifier[]
  span: Span
}

export interface ImportScanResult {
  imports: ImportRecord[]
  diagnostics: Diagnostic[]
}

export interface Matcher {
  modules: string[]
  /** Omit to match any imported name (used for recipes/patterns). */
  names?: string[]
}

export interface Matchers {
  css: Matcher
  recipe: Matcher
  pattern: Matcher
  jsx?: Matcher
  tokens: Matcher
  /** Resolved Panda token dictionary. When present, `token('path')` and
   *  `token.var('path')` calls fold to their dictionary value during
   *  extraction. */
  tokenDictionary?: TokenDictionary
  /** JSX factory names that accept member-chain tags (`<styled.div>`).
   *  Omit to use the built-in default `["styled"]`; provide an array to
   *  override (replaces the default outright — not additive). */
  jsxFactories?: string[]
}

/** Two parallel `path → string` maps backing `token()` resolution.
 *  - `values['colors.red.500']` → raw value, e.g. `'#ef4444'`
 *  - `vars['colors.red.500']` → CSS-var form, e.g. `'var(--colors-red-500)'` */
export interface TokenDictionary {
  values: Record<string, string>
  vars: Record<string, string>
}

export interface MatchedImport {
  category: MatchCategory
  module: string
  name: string
  alias: string
  kind: ImportSpecifierKind
}

export interface ExtractedCallsResult {
  calls: ExtractedCall[]
  diagnostics: Diagnostic[]
}

export interface ExtractedJsxResult {
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** Full result including raw + matched imports, for tooling / parity flows. */
export interface ExtractDebugResult {
  imports: ImportRecord[]
  matched: MatchedImport[]
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** Reusable extractor session — built once from a `Matchers` config, then
 *  called per file. For one-off use, prefer a `Compiler` + `extract`. */
export interface ExtractorSession {
  extract(path: string, source: string): ExtractResult
  extractDebug(path: string, source: string): ExtractDebugResult
  matchImports(scan: ImportScanResult): MatchedImport[]
}

export interface ExtractorSessionConstructor {
  new (matchers: Matchers): ExtractorSession
}

export interface TraceOptions {
  /** Tracing filter, e.g. "trace", "debug", or "pandacss_project=trace". */
  filter?: string
  /** `fmt` writes to stderr; `chrome-json` writes a Chrome trace file. */
  output?: 'fmt' | 'chrome-json'
  /** Required for useful `chrome-json` output. Defaults to `.panda/trace.json`. */
  file?: string
}

interface NativeCompilerOptions {
  crossFile?: boolean
}

/** The raw native instance — superset of {@link Compiler} carrying the internal
 *  methods the facade hides. */
export interface RawCompiler extends Compiler {
  token_dictionary?(): TokenDictionary | undefined
  registerUtilityTransform?(id: string, callback: (value: unknown) => unknown): void
  registerPatternTransform?(id: string, callback: (props: unknown, helpers: Record<string, unknown>) => unknown): void
}

export interface CompilerConstructor {
  fromConfig(
    config: SerializedConfig,
    options?: NativeCompilerOptions,
    utilityValuesCallbacks?: Record<string, (tokenDictionary: TokenDictionary | undefined) => unknown>,
  ): RawCompiler
}

export interface NativeBinding {
  startTracing?(options?: TraceOptions): boolean
  flushTracing?(): void
  shutdownTracing?(): boolean
  compile(input?: CompileInput): CompileOutput
  scanImports(path: string, source: string): ImportScanResult
  matchImports(scan: ImportScanResult, matchers: Matchers): MatchedImport[]
  extractCalls(path: string, source: string, matched: MatchedImport[], matchers: Matchers): ExtractedCallsResult
  extractJsx(path: string, source: string, matched: MatchedImport[], matchers: Matchers): ExtractedJsxResult
  extract(path: string, source: string, matchers: Matchers): ExtractResult
  extractDebug(path: string, source: string, matchers: Matchers): ExtractDebugResult
  Extractor: ExtractorSessionConstructor
  Compiler: CompilerConstructor
}

class FallbackExtractor implements ExtractorSession {
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  }
  extractDebug() {
    return { imports: [], matched: [], calls: [], jsx: [], diagnostics: [] }
  }
  matchImports() {
    return []
  }
}

class FallbackCompiler implements Compiler {
  static fromConfig() {
    return new FallbackCompiler()
  }
  config() {
    return {}
  }
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  }
  parseFile() {
    return { cssCalls: 0, cvaCalls: 0, svaCalls: 0, jsxUsages: 0, diagnostics: [] }
  }
  refreshFile() {
    return false
  }
  removeFile() {
    return false
  }
  clear() {
    /* no-op */
  }
  isEmpty() {
    return true
  }
  atoms() {
    return [] as Atom[]
  }
  recipes() {
    return []
  }
  slotRecipes() {
    return []
  }
  encodedRecipes() {
    return { base: [], variants: [], atomic: [] }
  }
  staticPatternAtoms() {
    return { atoms: [], diagnostics: [] }
  }
  getFile() {
    return null
  }
  fileManifest() {
    return []
  }
  summary() {
    return { filesProcessed: 0, atomCount: 0, recipeCount: 0, slotRecipeCount: 0 }
  }
  compile() {
    return {
      css: '',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [],
    }
  }
  diagnostics() {
    return [] as Diagnostic[]
  }
}

const fallback: NativeBinding = {
  startTracing() {
    return false
  },
  flushTracing() {
    /* no-op */
  },
  shutdownTracing() {
    return false
  },
  compile() {
    return {
      css: '',
      manifest: { files: [], tokens: [] },
      layerRanges: {},
      diagnostics: [],
    }
  },
  scanImports() {
    return { imports: [], diagnostics: [] }
  },
  matchImports() {
    return []
  },
  extractCalls() {
    return { calls: [], diagnostics: [] }
  },
  extractJsx() {
    return { jsx: [], diagnostics: [] }
  },
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  },
  extractDebug() {
    return { imports: [], matched: [], calls: [], jsx: [], diagnostics: [] }
  },
  Extractor: FallbackExtractor as unknown as ExtractorSessionConstructor,
  Compiler: FallbackCompiler as unknown as CompilerConstructor,
}

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
  return compiler
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
