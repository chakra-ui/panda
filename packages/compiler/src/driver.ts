import {
  BaseDriver,
  type CodegenArtifact,
  type GenerateArtifactOptions,
  type CodegenOptions,
  type Compiler,
  type DiffConfigResult,
  type Driver,
  type SourceChange,
} from '@pandacss/compiler-shared'
import {
  type HostHooks,
  type LoadConfigResult,
  diffConfig,
  loadConfig,
  mergeExcludes,
  resolveSmartInclude,
} from '@pandacss/config'
import { type Diagnostic } from '@pandacss/compiler-shared'
import { hydrateDesignSystem } from './design-system'
import { createCompilerFromSnapshot } from './index'

export interface NodeDriverOptions {
  cwd: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Override the config's `include` globs (e.g. CLI `--include`). Empty/omitted keeps the config value. */
  include?: string[]
}

type CodegenPrepareHooks = NonNullable<HostHooks['codegen:prepare']>

/**
 * {@link Driver} backed by the native compiler (`OsFileSystem`). Loads the
 * config from disk; `scan` / `codegen` run through the Rust fs engine.
 */
export async function createNodeDriver(options: NodeDriverOptions): Promise<Driver> {
  const loaded = await loadConfig({ cwd: options.cwd, file: options.configPath })
  if (options.include?.length) applyIncludeOverride(loaded, options.cwd, options.include)
  return new NodeDriver(options, loaded)
}

function applyIncludeOverride(loaded: LoadConfigResult, cwd: string, include: string[]): void {
  const deps = new Set(loaded.dependencies)
  const resolved = resolveSmartInclude(include, cwd, deps)
  loaded.config.include = resolved.include
  if (resolved.excludes.length > 0) {
    const existing = Array.isArray(loaded.config.exclude) ? loaded.config.exclude : undefined
    loaded.config.exclude = mergeExcludes(existing, resolved.excludes)
  }
  loaded.dependencies = Array.from(deps)
}

class NodeDriver extends BaseDriver {
  #options: NodeDriverOptions
  #loaded: LoadConfigResult
  #designSystemDiagnostics: Diagnostic[]

  constructor(options: NodeDriverOptions, loaded: LoadConfigResult) {
    const built = buildFromConfig(loaded)
    super(built.compiler)
    this.#options = options
    this.#loaded = loaded
    this.#designSystemDiagnostics = built.designSystemDiagnostics
  }

  get designSystemDiagnostics() {
    return this.#designSystemDiagnostics
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

  async reload(): Promise<DiffConfigResult> {
    const next = await loadConfig({ cwd: this.#options.cwd, file: this.#options.configPath })
    // Re-apply before diffing so the override isn't seen as a config change.
    if (this.#options.include?.length) applyIncludeOverride(next, this.#options.cwd, this.#options.include)
    const diff = diffConfig(this.#loaded, next)
    if (diff.hasChanged) {
      this.#loaded = next
      const built = buildFromConfig(next)
      this.setCompiler(built.compiler)
      this.#designSystemDiagnostics = built.designSystemDiagnostics
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
    hooks: CodegenPrepareHooks,
    outdir: string,
    cwd: string,
    options: CodegenOptions | undefined,
  ): string[] {
    let artifacts = this.compiler.generateArtifacts(toGenerateArtifactOptions(options))

    for (const entry of hooks) {
      const handler = resolveHookHandler(entry.value, 'codegen:prepare')
      const next = handler({ artifacts, outdir, cwd })

      if (next !== undefined) {
        if (!Array.isArray(next)) {
          throw new Error('Invalid codegen:prepare hook result. Expected an artifact array or undefined.')
        }

        artifacts = next as CodegenArtifact[]
      }
    }

    return this.compiler.writeArtifacts({
      outdir,
      cwd,
      forceImportExtension: options?.forceImportExtension,
      artifacts,
    })
  }

  override isConfigFile(file: string): boolean {
    // `realpath` (via the fs engine) follows symlinks so paths to the same file
    // compare equal — `dependencies` are relative to `cwd` (config's `collectDependencies`).
    const target = this.compiler.realpath(file)
    const configPath = this.compiler.realpath(this.#loaded.path)

    if (configPath === target) return true

    return this.#loaded.dependencies.some((dependency) => {
      const dependencyPath = this.compiler.resolvePath(dependency, this.#options.cwd)
      return this.compiler.realpath(dependencyPath) === target
    })
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

function buildFromConfig(loaded: LoadConfigResult): { compiler: Compiler; designSystemDiagnostics: Diagnostic[] } {
  const compiler = createCompilerFromSnapshot({
    config: loaded.config,
    callbacks: loaded.callbacks,
    hooks: loaded.hooks,
  })
  const designSystemDiagnostics = hydrateDesignSystem(
    compiler,
    loaded.metadata?.designSystem,
    loaded.metadata?.userTokenPaths ?? [],
  )
  return { compiler, designSystemDiagnostics }
}

function toGenerateArtifactOptions(options: CodegenOptions | undefined): GenerateArtifactOptions | undefined {
  return options?.forceImportExtension === undefined
    ? undefined
    : { forceImportExtension: options.forceImportExtension }
}
