import { BaseDriver, type Compiler, type ConfigDiff, type Driver, type SourceChange } from '@pandacss/compiler-shared'
import { type LoadedPandaConfig, diffConfig, loadPandaConfig } from '@pandacss/config-loader'
import { readFileSync } from 'node:fs'
import { createCompilerFromSnapshot } from './index'

export interface NodeDriverOptions {
  cwd: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
}

/**
 * {@link Driver} backed by the native compiler (`OsFileSystem`). Loads the
 * config from disk; `scan` / `writeArtifacts` run through the Rust fs engine.
 */
export async function createNodeDriver(options: NodeDriverOptions): Promise<Driver> {
  const loaded = await loadPandaConfig({ cwd: options.cwd, file: options.configPath })
  return new NodeDriver(options, loaded)
}

class NodeDriver extends BaseDriver {
  #options: NodeDriverOptions
  #loaded: LoadedPandaConfig

  constructor(options: NodeDriverOptions, loaded: LoadedPandaConfig) {
    super(buildFromConfig(loaded))
    this.#options = options
    this.#loaded = loaded
  }

  protected override get defaultCwd(): string {
    return this.#options.cwd
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
      this.setCompiler(buildFromConfig(next))
    }
    return diff
  }

  applyChange(change: SourceChange): boolean {
    if (change.kind === 'unlink') {
      return this.compiler.removeFile(change.path)
    }
    const content = change.content ?? readFileSync(change.path, 'utf8')
    this.compiler.parseFile(change.path, content)
    return true
  }
}

function buildFromConfig(loaded: LoadedPandaConfig): Compiler {
  return createCompilerFromSnapshot({ config: loaded.config, callbacks: loaded.callbacks })
}
