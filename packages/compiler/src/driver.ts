import {
  BaseDriver,
  type BuildInfoArtifact,
  type CodegenArtifact,
  type GenerateArtifactOptions,
  type CodegenOptions,
  type Compiler,
  type DesignSystemWatchFileKind,
  type DesignSystemWatchTarget,
  type Diagnostic,
  type DiffConfigResult,
  type SourceChange,
  collectParseDiagnostics,
  diagnosticsPass,
  normalizeDiagnostics,
} from '@pandacss/compiler-shared'
import {
  compilePreset,
  defaultImportMap,
  type HostHooks,
  type LoadConfigResult,
  diffConfig,
  loadConfig,
  mergeExcludes,
  readPackageIdentity,
  resolveSmartInclude,
  syncExports,
  toPosixRelative,
  toRelativeKey,
  type CompilePresetResult,
} from '@pandacss/config'
import { hydrateDesignSystem } from './design-system'
import { createCompilerFromSnapshot } from './index'

export interface NodeDriverOptions {
  cwd: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Override the config's `include` globs (e.g. CLI `--include`). Empty/omitted keeps the config value. */
  include?: string[]
}

export interface WriteDesignSystemLibOptions {
  outdir?: string
  files?: string[]
  panda?: string
  minify?: boolean
  maxWarnings?: number | string
}

export interface WriteDesignSystemLibResult {
  manifestPath: string
  buildInfoPath: string
  presetPath: string
  exportsChanged: boolean
  parsedFileCount: number
  diagnostics: Diagnostic[]
}

type CodegenPrepareHooks = NonNullable<HostHooks['codegen:prepare']>

interface ParsedDesignSystemLib {
  parsedFileCount: number
  diagnostics: Diagnostic[]
}

const DEFAULT_DESIGN_SYSTEM_LIB_OUTDIR = 'dist'
const DEFAULT_DESIGN_SYSTEM_LIB_FILES = ['./**/*.{js,mjs}']

/**
 * {@link Driver} backed by the native compiler (`OsFileSystem`). Loads the
 * config from disk; `scan` / `codegen` run through the Rust fs engine.
 */
export async function createNodeDriver(options: NodeDriverOptions): Promise<NodeDriver> {
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

export class NodeDriver extends BaseDriver {
  #options: NodeDriverOptions
  #loaded: LoadConfigResult
  #designSystemDiagnostics: Diagnostic[]
  #designSystemPreset: CompilePresetResult | undefined
  #designSystemArtifactSnapshot: string
  #designSystemWatchTargets: DesignSystemWatchTarget[] | undefined

  constructor(options: NodeDriverOptions, loaded: LoadConfigResult) {
    const built = buildFromConfig(loaded)
    super(built.compiler)
    this.#options = options
    this.#loaded = loaded
    this.#designSystemDiagnostics = built.designSystemDiagnostics
    this.#designSystemArtifactSnapshot = designSystemArtifactSnapshot(this.compiler, loaded)
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

  override designSystemWatchTargets(): DesignSystemWatchTarget[] {
    return (this.#designSystemWatchTargets ??= (this.#loaded.metadata?.designSystem ?? []).map((ds) => {
      const base = this.compiler.path.dirname(ds.manifestPath)
      const presetPath = realpathIfExists(this.compiler, this.compiler.path.resolve(ds.manifest.preset, base))
      const sourceFiles =
        ds.files.length > 0
          ? this.compiler.scan({ include: ds.files, cwd: base }).map((file) => realpathIfExists(this.compiler, file))
          : []

      return {
        name: ds.name,
        manifestPath: realpathIfExists(this.compiler, ds.manifestPath),
        buildInfoPath: realpathIfExists(this.compiler, ds.buildInfoPath),
        presetPath,
        sourceFiles: [...new Set(sourceFiles)],
      }
    }))
  }

  override isDesignSystemFile(file: string): DesignSystemWatchFileKind | false {
    const target = this.compiler.path.realpath(file)

    for (const watchTarget of this.#designSystemWatchTargets ?? this.designSystemWatchTargets()) {
      if (
        [watchTarget.manifestPath, watchTarget.buildInfoPath, watchTarget.presetPath].some(
          (path) => this.compiler.path.realpath(path) === target,
        )
      ) {
        return 'artifact'
      }

      if (watchTarget.sourceFiles.some((path) => this.compiler.path.realpath(path) === target)) {
        return 'source'
      }
    }

    return false
  }

  override async syncDesignSystemFileChange(change: SourceChange): Promise<boolean> {
    const kind = this.isDesignSystemFile(change.path)
    if (kind === 'artifact') {
      const diff = await this.reload()
      if (diff.hasChanged) this.parseFiles()
      return diff.hasChanged
    }
    if (kind === 'source') return this.applyChange(change)
    return false
  }

  async reload(): Promise<DiffConfigResult> {
    const next = await loadConfig({ cwd: this.#options.cwd, file: this.#options.configPath })
    // Re-apply before diffing so the override isn't seen as a config change.
    if (this.#options.include?.length) applyIncludeOverride(next, this.#options.cwd, this.#options.include)
    const diff = diffConfig(this.#loaded, next)
    const nextDesignSystemArtifactSnapshot = designSystemArtifactSnapshot(this.compiler, next)
    const designSystemArtifactsChanged = this.#designSystemArtifactSnapshot !== nextDesignSystemArtifactSnapshot

    if (diff.hasChanged || designSystemArtifactsChanged) {
      this.#loaded = next
      const built = buildFromConfig(next)
      this.setCompiler(built.compiler)
      this.#designSystemDiagnostics = built.designSystemDiagnostics
      this.#designSystemPreset = undefined
      this.#designSystemArtifactSnapshot = nextDesignSystemArtifactSnapshot
      this.#designSystemWatchTargets = undefined
    }
    return designSystemArtifactsChanged && !diff.hasChanged ? { ...diff, hasChanged: true } : diff
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
    return this.compiler.path.resolve(this.getConfiguredOutdir(outdir))
  }

  async writeDesignSystemLib(options: WriteDesignSystemLibOptions = {}): Promise<WriteDesignSystemLibResult> {
    if (!this.#loaded.path) {
      throw new Error(
        'panda lib requires a resolved config file to compile the design system preset. Run `panda init`, or check --config/--cwd.',
      )
    }

    const parsed = this.parseDesignSystemLib()
    if (!diagnosticsPass(parsed.diagnostics, { maxWarnings: options.maxWarnings }))
      return skippedDesignSystemLib(parsed)

    const preset = await this.compileDesignSystemPreset()
    return this.writeDesignSystemLibArtifacts(options, preset, parsed)
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
    const target = this.compiler.path.realpath(file)
    const configPath = this.compiler.path.realpath(this.#loaded.path)

    if (configPath === target) return true

    return this.#loaded.dependencies.some((dependency) => {
      const dependencyPath = this.compiler.path.resolve(dependency, this.#options.cwd)
      return this.compiler.path.realpath(dependencyPath) === target
    })
  }

  private parseDesignSystemLib(): ParsedDesignSystemLib {
    const parsed = this.parseFiles()
    const parseDiagnostics = collectParseDiagnostics(parsed, {
      normalizeFile: (file) => stabilizePath(this.#options.cwd, file),
    })
    const diagnostics = normalizeDiagnostics([...parseDiagnostics, ...this.compiler.diagnostics()], {
      normalizeFile: (file) => stabilizePath(this.#options.cwd, file),
    })

    return { parsedFileCount: parsed.length, diagnostics }
  }

  private async compileDesignSystemPreset(): Promise<CompilePresetResult> {
    return (this.#designSystemPreset ??= await compilePreset({
      configPath: this.#loaded.path,
      cwd: this.#options.cwd,
    }))
  }

  private writeDesignSystemLibArtifacts(
    options: WriteDesignSystemLibOptions,
    preset: CompilePresetResult,
    parsed: ParsedDesignSystemLib,
  ): WriteDesignSystemLibResult {
    const identity = readPackageIdentity(this.#options.cwd)
    const pandaRange = options.panda ?? identity.pandaPeer ?? '*'
    const outdir = options.outdir ?? DEFAULT_DESIGN_SYSTEM_LIB_OUTDIR
    const outRoot = this.compiler.path.resolve(outdir)

    const manifestPath = this.compiler.path.join([outRoot, 'panda.lib.json'])
    const buildInfoPath = this.compiler.path.join([outRoot, 'panda.buildinfo.json'])
    const presetPath = this.compiler.path.join([outRoot, 'preset.mjs'])

    const info = this.compiler.buildInfo.create({ panda: pandaRange })
    const buildInfo = this.compiler.buildInfo.normalize(info, {
      mapModuleKey: (key) => toRelativeKey(key, this.#options.cwd),
    })

    const manifest = this.compiler.designSystem.create({
      name: identity.name,
      version: identity.version,
      panda: pandaRange,
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      importMap: defaultImportMap(identity.name),
      designSystem: typeof this.config.designSystem === 'string' ? this.config.designSystem : undefined,
      files: options.files ?? inferDesignSystemLibFiles(this.compiler, this.#options.cwd, outRoot, buildInfo),
    })

    this.compiler.writeArtifacts({
      outdir,
      cwd: this.#options.cwd,
      artifacts: [
        {
          id: 'design-system-lib',
          files: [
            {
              path: 'panda.lib.json',
              code: `${JSON.stringify(manifest, null, 2)}\n`,
              dependencies: [],
            },
            {
              path: 'panda.buildinfo.json',
              code: JSON.stringify(buildInfo, null, options.minify ? 0 : 2),
              dependencies: [],
            },
            {
              path: 'preset.mjs',
              code: preset.code,
              dependencies: [],
            },
          ],
        },
      ],
    })

    const exportsChanged = syncPackageExports(this.compiler, identity.packagePath, {
      manifestPath,
      presetPath,
    })

    return {
      manifestPath,
      buildInfoPath,
      presetPath,
      exportsChanged,
      parsedFileCount: parsed.parsedFileCount,
      diagnostics: parsed.diagnostics,
    }
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

function skippedDesignSystemLib(parsed: ParsedDesignSystemLib): WriteDesignSystemLibResult {
  return {
    manifestPath: '',
    buildInfoPath: '',
    presetPath: '',
    exportsChanged: false,
    parsedFileCount: parsed.parsedFileCount,
    diagnostics: parsed.diagnostics,
  }
}

function syncPackageExports(
  compiler: Compiler,
  packagePath: string,
  paths: { manifestPath: string; presetPath: string },
): boolean {
  const base = compiler.path.dirname(packagePath)
  const entries = {
    './panda.lib.json': toPosixRelative(base, paths.manifestPath),
    './preset': toPosixRelative(base, paths.presetPath),
  }
  const packageJson = compiler.fs.readFile(packagePath)
  if (packageJson == null) {
    throw new Error(`Could not read package.json at ${JSON.stringify(packagePath)}.`)
  }
  const result = syncExports({ packageJson, entries })
  if (result.changed) {
    compiler.writeArtifacts({
      outdir: base,
      artifacts: [
        {
          id: 'design-system-lib-package',
          files: [{ path: 'package.json', code: result.json, dependencies: [] }],
        },
      ],
    })
  }
  return result.changed
}

function stabilizePath(cwd: string, file: string): string {
  const relativePath = toRelativeKey(file, cwd)
  return relativePath && !relativePath.startsWith('..') ? relativePath : file
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

function designSystemArtifactSnapshot(compiler: Compiler, loaded: LoadConfigResult): string {
  return JSON.stringify(
    loaded.metadata?.designSystem?.map((ds) => ({
      name: ds.name,
      specifier: ds.specifier,
      manifest: ds.manifest,
      manifestPath: ds.manifestPath,
      buildInfoPath: ds.buildInfoPath,
      buildInfo: compiler.fs.readFile(ds.buildInfoPath) ?? '',
      files: ds.files,
      tokenPaths: ds.tokenPaths,
    })) ?? [],
  )
}

function realpathIfExists(compiler: Compiler, path: string): string {
  return compiler.fs.exists(path) ? compiler.path.realpath(path) : path
}

function inferDesignSystemLibFiles(
  compiler: Compiler,
  cwd: string,
  outRoot: string,
  buildInfo: BuildInfoArtifact,
): string[] {
  const files = Object.keys(buildInfo.modules)
    .filter((key) => !key.startsWith('buildinfo:'))
    .map((key) => {
      const file = compiler.path.resolve(key, cwd)
      return toPosixRelative(outRoot, file)
    })

  return files.length > 0 ? [...new Set(files)] : DEFAULT_DESIGN_SYSTEM_LIB_FILES
}

function toGenerateArtifactOptions(options: CodegenOptions | undefined): GenerateArtifactOptions | undefined {
  return options?.forceImportExtension === undefined
    ? undefined
    : { forceImportExtension: options.forceImportExtension }
}
