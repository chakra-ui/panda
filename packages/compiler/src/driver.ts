import { BaseDriver, type Compiler, type ConfigDiff, type Driver, type SourceChange } from '@pandacss/compiler-shared'
import { type LoadedPandaConfig, diffConfig, loadPandaConfig } from '@pandacss/config-loader'
import { join } from 'node:path'
import { createCompilerFromSnapshot } from './index'

export interface NodeDriverOptions {
  cwd: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
}

/**
 * {@link Driver} backed by the native compiler (`OsFileSystem`). Loads the
 * config from disk; `scan` / `codegen` run through the Rust fs engine.
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
    if (change.kind === 'change') {
      if (change.content == null) {
        if (this.compiler.refreshFile(change.path)) return true
        this.compiler.parseFile(change.path)
        return true
      }
      if (this.compiler.refreshFileSource(change.path, change.content)) return true
      this.compiler.parseFileSource(change.path, change.content)
      return true
    }
    if (change.content == null) {
      this.compiler.parseFile(change.path)
      return true
    }
    this.compiler.parseFileSource(change.path, change.content)
    return true
  }

  override isConfigFile(file: string): boolean {
    // `realpath` (via the fs engine) follows symlinks so paths to the same file
    // compare equal — `dependencies` are relative to `cwd` (config-loader's `collectDependencies`).
    const target = this.compiler.realpath(file)
    if (this.compiler.realpath(this.#loaded.path) === target) return true
    return this.#loaded.dependencies.some((dep) => this.compiler.realpath(join(this.#options.cwd, dep)) === target)
  }
}

function buildFromConfig(loaded: LoadedPandaConfig): Compiler {
  return createCompilerFromSnapshot({ config: loaded.config, callbacks: loaded.callbacks })
}
