/**
 * Host layer (`Driver`) — the orchestration contract above the pure `Compiler`,
 * with shared behaviour in `BaseDriver`. The node host (`@pandacss/compiler`) and
 * browser host (`@pandacss/compiler-wasm`) each subclass it, split only by
 * environment. See `design-notes/output-and-host-layer.md`.
 */

import { introspect } from './introspect'
import type { Introspection } from './introspect'
import { getResolvedConfigOutdir } from './defaults'
import type {
  CodegenArtifact,
  CodegenDependency,
  CodegenOptions,
  Compiler,
  CompileOutput,
  CompileOptions,
  CssFile,
  ParseFileReport,
  SerializedConfig,
  WriteCssResult,
  WriteFilesResult,
} from './types'

/** Result of diffing two serialized configs — produced by config-loader's
 *  `diffConfig`, consumed by `Driver.reload`. */
export interface ConfigDiff {
  /** `true` when the configs differ (or there is no previous config). */
  hasChanged: boolean
  /** Coarse dependencies to feed `generateAffectedArtifacts(...)`. */
  dependencies: CodegenDependency[]
  /** Names of the specific recipes that changed — for per-entry file scoping. */
  recipes: string[]
  /** Names of the specific patterns that changed — for per-entry file scoping. */
  patterns: string[]
  /** Raw `microdiff` `Difference[]`, for the `config:change` hook / telemetry. */
  changes: unknown[]
}

/** A single source-file change routed in from a watcher. */
export interface SourceChange {
  path: string
  kind: 'add' | 'change' | 'unlink'
  /** File contents. Optional on node (the driver reads disk); required on the
   *  browser driver (no disk). */
  content?: string
}

/** Which artifacts to (re)generate. Omit for the full set. */
export interface ArtifactFilter {
  dependencies?: CodegenDependency[]
}

export interface DriverPaths {
  root: string
  styleFile: string
  stylesDir: string
}

/** Host orchestrator above the pure {@link Compiler}: owns config lifecycle,
 *  source scanning (via the engine's fs), output cadence, and watch wiring.
 *  {@link BaseDriver} implements the shared behaviour; the node
 *  (`@pandacss/compiler`) and browser (`@pandacss/compiler-wasm`) hosts subclass
 *  it, split only by environment. */
export interface Driver {
  /** The live engine handle (swapped on a config reload). */
  readonly compiler: Compiler
  /** The serialized config the current compiler was built from. */
  readonly config: SerializedConfig
  /** Resolved config path (node only). */
  readonly configPath?: string
  /** Module ids to watch for config invalidation. */
  readonly configDependencies: string[]
  /** Introspection over the current config (cached; rebuilt on `reload`). */
  readonly introspect: Introspection

  /** Re-load the config, diff it against the current one, and rebuild the
   *  compiler when it changed. Browser drivers are snapshot-fed → no-change. */
  reload(): Promise<ConfigDiff>
  /** Source paths matching the config includes/excludes. Does not parse. */
  scan(): string[]
  /** Scan, then parse every discovered source file via the engine fs. */
  parseFiles(): ParseFileReport[]
  /** Route one watcher event into the engine. `false` = unknown path / no-op. */
  applyChange(change: SourceChange): boolean
  /** Route a batch of watcher events; returns each one's result. */
  applyChanges(changes: SourceChange[]): boolean[]
  /** Codegen artifacts — full set, or only those affected by a diff. */
  artifacts(filter?: ArtifactFilter): CodegenArtifact[]
  /** Resolve the configured output directory, optionally applying a caller override. */
  getOutdir(outdir?: string): string
  /** Resolve a host path using the driver/compiler path semantics. */
  resolvePath(path: string): string
  /** Standard Panda output locations for an optional outdir override. */
  paths(outdir?: string): DriverPaths
  /** Generate + write artifacts under the configured `outdir` via the engine fs. Returns paths. */
  codegen(options?: CodegenOptions): string[]
  /** Generate stylesheet CSS → `CompileOutput`; the caller routes the `css` string. */
  cssgen(options?: CompileOptions): CompileOutput
  /** Generate split stylesheet files in memory without writing. */
  splitCss(): CssFile[]
  /** Generate + write stylesheet CSS through the host filesystem. Returns the compile output plus written path. */
  writeCss(outfile: string, options?: CompileOptions): WriteCssResult
  /** Generate + write split stylesheet files under the configured `outdir`. */
  writeSplitCss(outdir?: string): WriteFilesResult
  /** Watch targets for the host watcher: matched files, their base dirs, config deps. */
  watchTargets(): { sources: string[]; dirs: string[]; config: string[] }
  /** Whether a changed path is the config file or one of its bundled dependencies.
   *  Lets watch hosts route a change to `reload()` vs `applyChange()`. */
  isConfigFile(file: string): boolean
  /** Whether a changed path is a project source file (matches the config
   *  `include`/`exclude`). The source-side companion to {@link isConfigFile}. */
  isSourceFile(file: string): boolean
}

/** Full codegen set, or only the artifacts affected by a config diff. */
export function selectArtifacts(compiler: Compiler, filter?: ArtifactFilter): CodegenArtifact[] {
  return filter?.dependencies ? compiler.generateAffectedArtifacts(filter.dependencies) : compiler.generateArtifacts()
}

/**
 * Shared {@link Driver} orchestration over a {@link Compiler}. Everything
 * identical across hosts lives here — introspection caching, scan, batched
 * changes, artifact selection, compile, and watch-target derivation. Platform
 * packages subclass this and supply only what differs by environment: config
 * access, `reload`, and how a single change is applied (disk read vs in-memory
 * staging).
 */
export abstract class BaseDriver implements Driver {
  #compiler: Compiler
  #introspect: Introspection | undefined

  protected constructor(compiler: Compiler) {
    this.#compiler = compiler
  }

  /** Swap the engine handle (on a config reload) and drop derived caches. */
  protected setCompiler(compiler: Compiler): void {
    this.#compiler = compiler
    this.#introspect = undefined
  }

  get compiler(): Compiler {
    return this.#compiler
  }

  get introspect(): Introspection {
    return (this.#introspect ??= introspect(this.#compiler.spec()))
  }

  abstract get config(): SerializedConfig
  abstract get configPath(): string | undefined
  abstract get configDependencies(): string[]
  abstract reload(): Promise<ConfigDiff>
  abstract applyChange(change: SourceChange): boolean
  abstract getOutdir(outdir?: string): string

  scan(): string[] {
    return this.#compiler.scan()
  }

  parseFiles(): ParseFileReport[] {
    return this.#compiler.parseFiles(this.scan())
  }

  applyChanges(changes: SourceChange[]): boolean[] {
    return changes.map((change) => this.applyChange(change))
  }

  artifacts(filter?: ArtifactFilter): CodegenArtifact[] {
    return selectArtifacts(this.#compiler, filter)
  }

  codegen(options?: CodegenOptions): string[] {
    const outdir = this.getConfiguredOutdir(options?.outdir)
    const artifactOptions =
      options?.codegenImportExtensions === undefined
        ? undefined
        : { codegenImportExtensions: options.codegenImportExtensions }
    return this.#compiler.writeArtifacts(outdir, options?.cwd, artifactOptions)
  }

  cssgen(options?: CompileOptions): CompileOutput {
    return this.#compiler.compile(options)
  }

  splitCss(): CssFile[] {
    return this.#compiler.splitCss()
  }

  resolvePath(path: string): string {
    return this.#compiler.resolvePath(path)
  }

  paths(outdir?: string): DriverPaths {
    const root = this.getOutdir(outdir)
    return {
      root,
      styleFile: this.#compiler.joinPath([root, 'styles.css']),
      stylesDir: this.#compiler.joinPath([root, 'styles']),
    }
  }

  writeCss(outfile: string, options?: CompileOptions): WriteCssResult {
    return this.#compiler.writeCss(outfile, undefined, options)
  }

  writeSplitCss(outdir?: string): WriteFilesResult {
    return this.#compiler.writeSplitCss(this.getConfiguredOutdir(outdir))
  }

  watchTargets(): { sources: string[]; dirs: string[]; config: string[] } {
    const sources = this.#compiler.sources()
    return {
      sources: sources.map((source) => source.pattern),
      dirs: [...new Set(sources.map((source) => source.base))],
      config: this.configDependencies,
    }
  }

  // Config-file resolution is path-based and disk-bound, so it lives in the node
  // host; snapshot-fed environments (browser) don't watch config files.
  isConfigFile(_file: string): boolean {
    return false
  }

  // Source matching is engine-owned (config globs); the Driver exposes it next to
  // `isConfigFile` so watch hosts get one classification surface, not `.compiler`.
  isSourceFile(file: string): boolean {
    return this.#compiler.isSourceFile(file)
  }

  protected getConfiguredOutdir(outdir?: string): string {
    return outdir ?? getResolvedConfigOutdir(this.config)
  }
}
