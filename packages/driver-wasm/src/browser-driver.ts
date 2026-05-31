import {
  type ArtifactFilter,
  type Compiler,
  type ConfigDiff,
  type Driver,
  type Introspection,
  type SerializedConfig,
  type SourceChange,
  introspect,
} from '@pandacss/compiler-shared'
import { createCompilerFromSnapshot, createCompilerFromWasmModule } from '@pandacss/compiler-wasm'
import { selectArtifacts } from './select'
import type { BrowserDriverOptions } from './types'

const NO_CHANGE: ConfigDiff = { hasChanged: false, dependencies: [], recipes: [], patterns: [], changes: [] }

/**
 * Build a {@link Driver} backed by the wasm compiler (`@pandacss/compiler-wasm`,
 * `MemoryFileSystem`). The browser has no disk, so the host hands in a pre-built
 * config snapshot and stages source files into the in-memory fs; `scan`/`glob`
 * then run over that tree in Rust.
 *
 * Pass an initialized `pkg-web` `module` for the real browser path; omit it in
 * Node/SSR/tests to load the bundled `pkg-node` artifact.
 */
export async function createBrowserDriver(options: BrowserDriverOptions): Promise<Driver> {
  const compiler = options.module
    ? createCompilerFromWasmModule(options.module, options.snapshot.config, {
        callbacks: options.snapshot.callbacks,
      })
    : await createCompilerFromSnapshot(options.snapshot)

  if (options.sources) {
    for (const [path, content] of Object.entries(options.sources)) {
      compiler.fs?.addFile(path, content)
    }
  }
  return new BrowserDriver(compiler, options.snapshot.config)
}

class BrowserDriver implements Driver {
  #compiler: Compiler
  #config: SerializedConfig
  #introspect: Introspection | undefined

  constructor(compiler: Compiler, config: SerializedConfig) {
    this.#compiler = compiler
    this.#config = config
  }

  get compiler() {
    return this.#compiler
  }

  get config() {
    return this.#config
  }

  get configPath() {
    return undefined
  }

  get configDependencies() {
    return []
  }

  get introspect(): Introspection {
    return (this.#introspect ??= introspect(this.#compiler.spec()))
  }

  // Browser drivers are snapshot-fed; reloading happens by constructing a fresh
  // driver with a new snapshot, so there's nothing to diff here.
  async reload(): Promise<ConfigDiff> {
    return NO_CHANGE
  }

  scan() {
    return this.#compiler.scan()
  }

  applyChange(change: SourceChange): boolean {
    if (change.kind === 'unlink') {
      this.#compiler.fs?.removeFile(change.path)
      return this.#compiler.removeFile(change.path)
    }
    if (change.content == null) return false
    this.#compiler.fs?.addFile(change.path, change.content)
    this.#compiler.parseFile(change.path, change.content)
    return true
  }

  applyChanges(changes: SourceChange[]): boolean[] {
    return changes.map((change) => this.applyChange(change))
  }

  artifacts(filter?: ArtifactFilter) {
    return selectArtifacts(this.#compiler, filter)
  }

  writeArtifacts(outdir: string, cwd?: string) {
    return this.#compiler.writeArtifacts(outdir, cwd)
  }

  compile() {
    return this.#compiler.compile()
  }

  watchTargets() {
    const sources = this.#compiler.sources()
    return {
      sources: sources.map((source) => source.pattern),
      dirs: [...new Set(sources.map((source) => source.base))],
      config: [] as string[],
    }
  }
}
