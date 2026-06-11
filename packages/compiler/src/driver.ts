import {
  BaseDriver,
  type CodegenArtifact,
  type CodegenOptions,
  type Compiler,
  type ConfigDiff,
  type Driver,
  type SourceChange,
} from '@pandacss/compiler-shared'
import { type LoadedPandaConfig, diffConfig, loadPandaConfig } from '@pandacss/config'
import { mkdirSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
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
    const diff = diffConfig(this.#loaded, next)
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

  getOutdir(outdir?: string): string {
    return this.compiler.resolvePath(this.getConfiguredOutdir(outdir))
  }

  override codegen(options?: CodegenOptions): string[] {
    const outdir = this.getOutdir(options?.outdir)
    const cwd = options?.cwd ?? this.#options.cwd
    const prepareHooks = this.#loaded.hostHooks?.['codegen:prepare'] ?? []
    const doneHooks = this.#loaded.hostHooks?.['codegen:done'] ?? []
    const files =
      prepareHooks.length > 0
        ? this.codegenWithPrepareHooks(prepareHooks, outdir, cwd, options)
        : super.codegen(options)

    for (const entry of doneHooks) {
      const handler = resolveHookHandler(entry.value, 'codegen:done')
      handler({ files, outdir, cwd })
    }

    return files
  }

  private codegenWithPrepareHooks(
    hooks: NonNullable<LoadedPandaConfig['hostHooks']>['codegen:prepare'],
    outdir: string,
    cwd: string,
    options: CodegenOptions | undefined,
  ): string[] {
    const artifactOptions =
      options?.forceImportExtension === undefined ? undefined : { forceImportExtension: options.forceImportExtension }
    let artifacts = this.compiler.generateArtifacts(artifactOptions)

    for (const entry of hooks ?? []) {
      const handler = resolveHookHandler(entry.value, 'codegen:prepare')
      const next = handler({ artifacts, outdir, cwd })
      if (next !== undefined) {
        if (!Array.isArray(next)) {
          throw new Error('Invalid codegen:prepare hook result. Expected an artifact array or undefined.')
        }
        artifacts = next as CodegenArtifact[]
      }
    }

    return writeArtifacts(this.compiler, outdir, artifacts)
  }

  override isConfigFile(file: string): boolean {
    // `realpath` (via the fs engine) follows symlinks so paths to the same file
    // compare equal — `dependencies` are relative to `cwd` (config's `collectDependencies`).
    const target = this.compiler.realpath(file)
    if (this.compiler.realpath(this.#loaded.path) === target) return true
    return this.#loaded.dependencies.some((dep) => this.compiler.realpath(join(this.#options.cwd, dep)) === target)
  }
}

type HookHandler = (args: unknown) => unknown

function resolveHookHandler(value: unknown, name: string): HookHandler {
  if (typeof value === 'function') return value as HookHandler
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${name} hook. Expected a function or { filter, handler }.`)
  }

  const handler = (value as Record<string, unknown>).handler
  if (typeof handler !== 'function') {
    throw new Error(`Invalid ${name} hook. Expected a function or { filter, handler }.`)
  }

  return handler as HookHandler
}

function writeArtifacts(compiler: Compiler, outdir: string, artifacts: CodegenArtifact[]): string[] {
  const written: string[] = []

  for (const artifact of artifacts) {
    for (const file of artifact.files) {
      if (isAbsolute(file.path)) {
        throw new Error(`artifact output path must be relative: ${file.path}`)
      }

      const target = compiler.joinPath([outdir, file.path])
      const parent = compiler.dirname(target)
      if (parent) mkdirSync(parent, { recursive: true })
      writeFileSync(target, file.code)
      written.push(target)
    }
  }

  return written
}

function buildFromConfig(loaded: LoadedPandaConfig): Compiler {
  return createCompilerFromSnapshot({ config: loaded.config, callbacks: loaded.callbacks, hooks: loaded.hooks })
}
