import { createCompilerFromSnapshot } from '@pandacss/compiler'
import {
  type ArtifactFilter,
  type Compiler,
  type ConfigDiff,
  type Driver,
  type Introspection,
  type SourceChange,
  introspect,
} from '@pandacss/compiler-shared'
import { type LoadedPandaConfig, diffConfig, loadPandaConfig } from '@pandacss/config-loader'
import { readFileSync } from 'node:fs'
import { selectArtifacts } from './select'
import type { NodeDriverOptions } from './types'

/**
 * {@link Driver} backed by the native compiler (`@pandacss/compiler`,
 * `OsFileSystem`). Loads the config from disk; `scan`/`glob`/`writeArtifacts`
 * run through the Rust fs engine.
 */
export async function createNodeDriver(options: NodeDriverOptions): Promise<Driver> {
  const loaded = await loadPandaConfig({ cwd: options.cwd, file: options.configPath })
  return new NodeDriver(options, loaded)
}

class NodeDriver implements Driver {
  #options: NodeDriverOptions
  #loaded: LoadedPandaConfig
  #compiler: Compiler
  #introspect: Introspection | undefined

  constructor(options: NodeDriverOptions, loaded: LoadedPandaConfig) {
    this.#options = options
    this.#loaded = loaded
    this.#compiler = build(loaded)
  }

  get compiler() {
    return this.#compiler
  }

  get config() {
    return this.#loaded.config
  }

  get configPath() {
    return this.#loaded.path
  }

  get configDependencies() {
    return this.#loaded.dependencies
  }

  get introspect(): Introspection {
    return (this.#introspect ??= introspect(this.#compiler.spec()))
  }

  async reload(): Promise<ConfigDiff> {
    const next = await loadPandaConfig({ cwd: this.#options.cwd, file: this.#options.configPath })
    const diff = diffConfig(this.#loaded.config, next.config)
    if (diff.hasChanged) {
      this.#loaded = next
      this.#compiler = build(next)
      this.#introspect = undefined
    }
    return diff
  }

  scan() {
    return this.#compiler.scan()
  }

  applyChange(change: SourceChange): boolean {
    if (change.kind === 'unlink') {
      return this.#compiler.removeFile(change.path)
    }
    const content = change.content ?? readFileSync(change.path, 'utf8')
    this.#compiler.parseFile(change.path, content)
    return true
  }

  applyChanges(changes: SourceChange[]): boolean[] {
    return changes.map((change) => this.applyChange(change))
  }

  artifacts(filter?: ArtifactFilter) {
    return selectArtifacts(this.#compiler, filter)
  }

  writeArtifacts(outdir: string, cwd?: string) {
    return this.#compiler.writeArtifacts(outdir, cwd ?? this.#options.cwd)
  }

  compile() {
    return this.#compiler.compile()
  }

  watchTargets() {
    const sources = this.#compiler.sources()
    return {
      sources: sources.map((source) => source.pattern),
      dirs: [...new Set(sources.map((source) => source.base))],
      config: this.#loaded.dependencies,
    }
  }
}

function build(loaded: LoadedPandaConfig): Compiler {
  return createCompilerFromSnapshot({ config: loaded.config, callbacks: loaded.callbacks })
}
