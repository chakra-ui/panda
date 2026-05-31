import { createCompilerFromSnapshot } from '@pandacss/compiler'
import type { ArtifactFilter, Compiler, ConfigDiff, Driver, SourceChange } from '@pandacss/compiler-shared'
import { type LoadedPandaConfig, diffConfig, loadPandaConfig } from '@pandacss/config-loader'
import { readFileSync } from 'node:fs'
import { selectArtifacts } from './select'
import type { NodeDriverOptions } from './types'

/**
 * Build a {@link Driver} backed by the native compiler (`@pandacss/compiler`,
 * `OsFileSystem`). Loads + serializes the config from disk, then drives the
 * engine — `scan`/`glob` read real files in Rust.
 */
export async function createNodeDriver(options: NodeDriverOptions): Promise<Driver> {
  const loaded = await loadPandaConfig({ cwd: options.cwd, file: options.configPath })
  return new NodeDriver(options, loaded)
}

class NodeDriver implements Driver {
  #options: NodeDriverOptions
  #loaded: LoadedPandaConfig
  #compiler: Compiler

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

  async reload(): Promise<ConfigDiff> {
    const next = await loadPandaConfig({ cwd: this.#options.cwd, file: this.#options.configPath })
    const diff = diffConfig(this.#loaded.config, next.config)
    if (diff.hasChanged) {
      this.#loaded = next
      this.#compiler = build(next)
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

  artifacts(filter?: ArtifactFilter) {
    return selectArtifacts(this.#compiler, filter)
  }

  compile() {
    return this.#compiler.compile()
  }

  watchTargets() {
    return { sources: this.#compiler.glob(), config: this.#loaded.dependencies }
  }
}

function build(loaded: LoadedPandaConfig): Compiler {
  return createCompilerFromSnapshot({ config: loaded.config, callbacks: loaded.callbacks })
}
