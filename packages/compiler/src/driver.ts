import {
  BaseDriver,
  type BuildInfoArtifact,
  type CodegenOverlay,
  type GenerateArtifactOptions,
  type CodegenOptions,
  type CompileOptions,
  type CompileOutput,
  type Compiler,
  type DesignSystemWatchFileKind,
  type DesignSystemWatchTarget,
  type Diagnostic,
  type DiffConfigResult,
  type SourceChange,
  type WriteCssOptions,
  type WriteCssResult,
  type WriteSplitCssResult,
  type WriteLayerCssOptions,
  type WriteSplitCssOptions,
  collectParseDiagnostics,
  diagnosticsPass,
  fromCodegenPrepareArtifacts,
  normalizeDiagnostics,
} from '@pandacss/compiler-shared'
import type { CssgenDoneHookArgs } from '@pandacss/types'
import {
  buildCodegenOverlay,
  compilePreset,
  defaultImportMap,
  type HostHooks,
  type LoadConfigResult,
  diffConfig,
  filterPublishableLibFiles,
  loadConfig,
  mergeExcludes,
  readPackageIdentity,
  readPandaVersion,
  resolvePublishedPandaRange,
  resolveSmartInclude,
  syncExports,
  toPosixRelative,
  toRelativeKey,
  type CompilePresetResult,
} from '@pandacss/config'
import { statSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { collectImportSelections, hydrateDesignSystem, treeshakeKeyFromSelections } from './design-system'
import { createProjectFromLoadedConfig, treeshakeDesignSystemEnabled } from './tooling/create-project'

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
type CssgenDoneHooks = NonNullable<HostHooks['cssgen:done']>

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
  #codegenOverlay: CodegenOverlay | undefined
  #codegenOverlayResolved = false
  #designSystemTreeshakeKey: string
  #configFilePaths: Set<string> | undefined
  #designSystemFileKinds: Map<string, DesignSystemWatchFileKind> | undefined
  #sourceGeneration = 0
  #treeshakeSyncedGeneration = -1

  constructor(options: NodeDriverOptions, loaded: LoadConfigResult) {
    const built = createProjectFromLoadedConfig(loaded)
    super(built.compiler)
    this.#options = options
    this.#loaded = loaded
    this.#designSystemDiagnostics = built.designSystemDiagnostics
    this.#designSystemArtifactSnapshot = designSystemArtifactSnapshot(loaded)
    this.#designSystemTreeshakeKey = built.designSystemTreeshakeKey ?? ''
  }

  get designSystemDiagnostics() {
    return this.#designSystemDiagnostics
  }

  protected override codegenOverlay(): CodegenOverlay | undefined {
    if (!this.#codegenOverlayResolved) {
      this.#codegenOverlay = buildCodegenOverlay(this.#loaded.metadata)
      this.#codegenOverlayResolved = true
    }
    return this.#codegenOverlay
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
      const manifestDir = this.compiler.path.dirname(ds.manifestPath)
      const presetPath = realpathIfExists(this.compiler, this.compiler.path.resolve(ds.manifest.preset, manifestDir))
      const filesCwd = designSystemFilesCwd(this.compiler, ds.manifestPath)
      const sourceFiles =
        ds.files.length > 0
          ? this.compiler
              .scan({ include: ds.files, cwd: filesCwd })
              .map((file) => realpathIfExists(this.compiler, file))
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
    const kinds = (this.#designSystemFileKinds ??= this.buildDesignSystemFileKinds())
    return kinds.get(this.compiler.path.realpath(file)) ?? false
  }

  private buildDesignSystemFileKinds(): Map<string, DesignSystemWatchFileKind> {
    const kinds = new Map<string, DesignSystemWatchFileKind>()
    for (const watchTarget of this.#designSystemWatchTargets ?? this.designSystemWatchTargets()) {
      for (const path of [watchTarget.manifestPath, watchTarget.buildInfoPath, watchTarget.presetPath]) {
        kinds.set(this.compiler.path.realpath(path), 'artifact')
      }
      for (const path of watchTarget.sourceFiles) {
        kinds.set(this.compiler.path.realpath(path), 'source')
      }
    }
    return kinds
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

  override syncDesignSystemSources(): boolean[] {
    const changes: SourceChange[] = []
    const activeFiles = new Map(
      this.compiler.fileManifest().map((file) => [this.compiler.path.realpath(file.path), file.path]),
    )

    for (const target of this.designSystemWatchTargets()) {
      for (const path of target.sourceFiles) {
        const activePath = activeFiles.get(this.compiler.path.realpath(path))
        if (!activePath) continue
        changes.push({ path: activePath, kind: this.compiler.fs.exists(path) ? 'change' : 'unlink' })
      }
    }

    return this.applyChanges(changes)
  }

  async reload(): Promise<DiffConfigResult> {
    const next = await loadConfig({ cwd: this.#options.cwd, file: this.#options.configPath })
    // Re-apply before diffing so the override isn't seen as a config change.
    if (this.#options.include?.length) applyIncludeOverride(next, this.#options.cwd, this.#options.include)
    const diff = diffConfig(this.#loaded, next)
    const nextDesignSystemArtifactSnapshot = designSystemArtifactSnapshot(next)
    const designSystemArtifactsChanged = this.#designSystemArtifactSnapshot !== nextDesignSystemArtifactSnapshot

    if (diff.hasChanged || designSystemArtifactsChanged) {
      this.#loaded = next
      const built = createProjectFromLoadedConfig(next)
      this.setCompiler(built.compiler)
      this.#designSystemDiagnostics = built.designSystemDiagnostics
      this.#designSystemPreset = undefined
      this.#designSystemArtifactSnapshot = nextDesignSystemArtifactSnapshot
      this.#designSystemWatchTargets = undefined
      this.#codegenOverlay = undefined
      this.#codegenOverlayResolved = false
      this.#designSystemTreeshakeKey = built.designSystemTreeshakeKey ?? ''
      this.#configFilePaths = undefined
      this.#designSystemFileKinds = undefined
      this.#sourceGeneration++
      this.#treeshakeSyncedGeneration = -1
    }
    return designSystemArtifactsChanged && !diff.hasChanged ? { ...diff, hasChanged: true } : diff
  }

  /** Re-hydrate when treeshake import set changes. */
  syncDesignSystemTreeShake(): boolean {
    if (!treeshakeDesignSystemEnabled(this.#loaded.config)) return false
    const chain = this.#loaded.metadata?.designSystem
    if (!chain?.length) return false
    if (this.#treeshakeSyncedGeneration === this.#sourceGeneration) return false

    const selections = collectImportSelections(this.compiler, chain)
    const nextKey = treeshakeKeyFromSelections(chain, selections)
    this.#treeshakeSyncedGeneration = this.#sourceGeneration
    if (nextKey === this.#designSystemTreeshakeKey) return false

    const hydrated = hydrateDesignSystem(this.compiler, {
      chain,
      consumerTokenPaths: this.#loaded.metadata?.userTokenPaths ?? [],
      treeshake: true,
      importSelections: selections,
    })
    this.#designSystemDiagnostics = hydrated.diagnostics
    this.#designSystemTreeshakeKey = hydrated.treeshakeKey
    return true
  }

  protected override prepareCssOutput(): void {
    this.syncDesignSystemTreeShake()
  }

  applyChange(change: SourceChange): boolean {
    this.#sourceGeneration++
    this.#treeshakeSyncedGeneration = -1

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

  override cssgen(options?: CompileOptions): CompileOutput {
    const output = super.cssgen(options)
    this.runCssgenDone({
      artifact: 'styles.css',
      content: output.css,
      cwd: this.#options.cwd,
      manifest: output.manifest,
      layerRanges: output.layerRanges,
    })
    return output
  }

  override writeCss(options: WriteCssOptions): WriteCssResult {
    const result = super.writeCss(options)
    this.runCssgenDone({
      artifact: 'styles.css',
      content: result.css,
      path: result.path,
      outfile: options.outfile,
      cwd: options.cwd ?? this.#options.cwd,
      manifest: result.manifest,
      layerRanges: result.layerRanges,
    })
    return result
  }

  override writeLayerCss(options: WriteLayerCssOptions): WriteCssResult {
    const result = super.writeLayerCss(options)
    this.runCssgenDone({
      artifact: 'styles.layer',
      content: result.css,
      path: result.path,
      outfile: options.outfile,
      cwd: options.cwd ?? this.#options.cwd,
      manifest: result.manifest,
      layerRanges: result.layerRanges,
    })
    return result
  }

  override writeSplitCss(options?: WriteSplitCssOptions): WriteSplitCssResult {
    const result = super.writeSplitCss(options)
    const cwd = options?.cwd ?? this.#options.cwd
    const outdir = result.root
    for (const file of result.files) {
      const path = this.compiler.path.join([result.root, file.path])
      this.runCssgenDone({
        artifact: 'styles.split',
        content: file.code,
        path,
        outdir,
        cwd,
      })
    }
    return result
  }

  private runCssgenDone(args: CssgenDoneHookArgs): void {
    const hooks: CssgenDoneHooks = this.#loaded.hostHooks?.['cssgen:done'] ?? []
    for (const entry of hooks) {
      const handler = resolveHookHandler(entry.value, 'cssgen:done')
      handler(args)
    }
  }

  private codegenWithPrepareHooks(
    hooks: CodegenPrepareHooks,
    outdir: string,
    cwd: string,
    options: CodegenOptions | undefined,
  ): string[] {
    const overlay = this.codegenOverlay()
    let artifacts = this.compiler.generateArtifacts({ ...toGenerateArtifactOptions(options), overlay })

    for (const entry of hooks) {
      const handler = resolveHookHandler(entry.value, 'codegen:prepare')
      const next = handler({ artifacts, outdir, cwd })

      if (next !== undefined) {
        if (!Array.isArray(next)) {
          throw new Error('Invalid codegen:prepare hook result. Expected an artifact array or undefined.')
        }

        artifacts = fromCodegenPrepareArtifacts(next)
      }
    }

    return this.compiler.writeArtifacts({
      outdir,
      cwd,
      forceImportExtension: options?.forceImportExtension,
      artifacts,
      overlay,
    })
  }

  override isConfigFile(file: string): boolean {
    const paths = (this.#configFilePaths ??= this.buildConfigFilePaths())
    return paths.has(this.compiler.path.realpath(file))
  }

  private buildConfigFilePaths(): Set<string> {
    // `realpath` (via the fs engine) follows symlinks so paths to the same file
    // compare equal — `dependencies` are relative to `cwd` (config's `collectDependencies`).
    const paths = new Set<string>()
    if (this.#loaded.path) {
      paths.add(this.compiler.path.realpath(this.#loaded.path))
    }
    for (const dependency of this.#loaded.dependencies) {
      const dependencyPath = this.compiler.path.resolve(dependency, this.#options.cwd)
      paths.add(this.compiler.path.realpath(dependencyPath))
    }
    return paths
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
    const pandaRange = resolvePublishedPandaRange(options.panda ?? identity.pandaPeer, readPandaVersion())
    const outdir = options.outdir ?? DEFAULT_DESIGN_SYSTEM_LIB_OUTDIR
    const outRoot = this.compiler.path.resolve(outdir)

    const pandaDir = this.compiler.path.join([outRoot, 'panda'])
    const manifestPath = this.compiler.path.join([pandaDir, 'lib.json'])
    const buildInfoPath = this.compiler.path.join([pandaDir, 'buildinfo.json'])
    const presetPath = this.compiler.path.join([pandaDir, 'preset.mjs'])

    const info = this.compiler.buildInfo.create({ panda: pandaRange })
    const buildInfo = this.compiler.buildInfo.normalize(info, {
      mapModuleKey: (key) => toRelativeKey(key, this.#options.cwd),
    })

    const { files: libFiles, diagnostics: filesDiagnostics } = resolveDesignSystemLibFiles({
      explicit: options.files,
      compiler: this.compiler,
      cwd: this.#options.cwd,
      filesBase: outRoot,
      buildInfo,
      packageRoot: this.compiler.path.dirname(identity.packagePath),
      publishFiles: identity.publishFiles,
      packageName: identity.name,
    })

    const manifest = this.compiler.designSystem.create({
      name: identity.name,
      version: identity.version,
      panda: pandaRange,
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      importMap: defaultImportMap(identity.name),
      designSystem: typeof this.config.designSystem === 'string' ? this.config.designSystem : undefined,
      files: libFiles,
    })

    this.compiler.writeArtifacts({
      outdir,
      cwd: this.#options.cwd,
      artifacts: [
        {
          id: 'design-system-lib',
          files: [
            {
              path: 'panda/lib.json',
              code: `${JSON.stringify(manifest, null, 2)}\n`,
              dependencies: [],
            },
            {
              path: 'panda/buildinfo.json',
              code: JSON.stringify(buildInfo, null, options.minify ? 0 : 2),
              dependencies: [],
            },
            {
              path: 'panda/preset.mjs',
              code: preset.code,
              dependencies: [],
            },
          ],
        },
      ],
    })

    const { changed: exportsChanged, conflicts } = syncPackageExports(this.compiler, identity.packagePath, {
      pandaDir,
      styledDir: this.getOutdir(),
    })

    return {
      manifestPath,
      buildInfoPath,
      presetPath,
      exportsChanged,
      parsedFileCount: parsed.parsedFileCount,
      diagnostics: [...parsed.diagnostics, ...filesDiagnostics, ...exportConflictDiagnostics(identity.name, conflicts)],
    }
  }
}

function resolveDesignSystemLibFiles(options: {
  explicit?: string[]
  compiler: Compiler
  cwd: string
  filesBase: string
  buildInfo: BuildInfoArtifact
  packageRoot: string
  publishFiles?: string[]
  packageName: string
}): { files: string[]; diagnostics: Diagnostic[] } {
  if (options.explicit) {
    return { files: options.explicit, diagnostics: [] }
  }

  const inferred = inferDesignSystemLibFiles(options.compiler, options.cwd, options.filesBase, options.buildInfo)
  const { files, unpublished } = filterPublishableLibFiles({
    files: inferred,
    packageRoot: options.packageRoot,
    outRoot: options.filesBase,
    publishFiles: options.publishFiles,
  })

  if (unpublished.length === 0) {
    return { files, diagnostics: [] }
  }

  return {
    files,
    diagnostics: [unpublishedLibFilesDiagnostic(options.packageName, unpublished)],
  }
}

function unpublishedLibFilesDiagnostic(name: string, unpublished: string[]): Diagnostic {
  const sample = unpublished
    .slice(0, 3)
    .map((path) => JSON.stringify(path))
    .join(', ')
  const more = unpublished.length > 3 ? `, and ${unpublished.length - 3} more` : ''
  return {
    code: 'design_system_files_not_publishable',
    severity: 'warning',
    category: 'designSystem',
    message:
      `\`panda lib\` omitted ${unpublished.length === 1 ? 'a fallback file' : 'fallback files'} from ${JSON.stringify(name)}'s manifest because package.json \`"files"\` would not publish ${sample}${more}. ` +
      `Happy-path consumers still hydrate build info. For dist-only recovery, re-run with \`panda lib --files './**/*.{js,mjs}'\` (or the globs you actually publish).`,
  }
}

function exportConflictDiagnostics(name: string, conflicts: string[]): Diagnostic[] {
  if (conflicts.length === 0) return []
  const paths = conflicts.map((path) => JSON.stringify(path)).join(', ')
  const plural = conflicts.length > 1
  return [
    {
      code: 'design_system_export_overwritten',
      severity: 'warning',
      category: 'designSystem',
      message: `\`panda lib\` overwrote the existing ${paths} export${plural ? 's' : ''} in ${JSON.stringify(name)}'s package.json. Restore or rename ${plural ? 'them' : 'it'} if you still need the previous target${plural ? 's' : ''}.`,
    },
  ]
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

const STYLED_SYSTEM_CATEGORIES = ['css', 'recipes', 'patterns', 'jsx', 'tokens', 'helpers'] as const
const DEEP_IMPORT_CATEGORIES = new Set(['css', 'recipes', 'patterns', 'jsx'])
const SINGLE_FILE_CATEGORIES = new Set(['helpers'])

function syncPackageExports(
  compiler: Compiler,
  packagePath: string,
  paths: { pandaDir: string; styledDir: string },
): { changed: boolean; conflicts: string[] } {
  const base = compiler.path.dirname(packagePath)
  const pandaGlob = `${toPosixRelative(base, paths.pandaDir)}/*`
  const entries = {
    './panda/*': pandaGlob,
    ...styledSystemExports(compiler, base, paths.styledDir),
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
  return { changed: result.changed, conflicts: result.conflicts }
}

function styledSystemExports(compiler: Compiler, base: string, styledDir: string): Record<string, unknown> {
  const rel = (path: string) => toPosixRelative(base, path)
  const find = (dir: string, names: string[]) =>
    names.map((name) => compiler.path.join([dir, name])).find((path) => compiler.fs.readFile(path) != null)

  const entries: Record<string, unknown> = {}
  for (const category of STYLED_SYSTEM_CATEGORIES) {
    if (SINGLE_FILE_CATEGORIES.has(category)) {
      const runtime = find(styledDir, [`${category}.mjs`, `${category}.js`, `${category}.ts`])
      if (!runtime) continue
      const types = find(styledDir, [`${category}.d.mts`, `${category}.d.ts`])
      entries[`./${category}`] = types ? { types: rel(types), default: rel(runtime) } : rel(runtime)
      continue
    }

    const dir = compiler.path.join([styledDir, category])
    const runtime = find(dir, ['index.mjs', 'index.js', 'index.ts'])
    if (!runtime) continue
    const types = find(dir, ['index.d.mts', 'index.d.ts'])
    entries[`./${category}`] = types ? { types: rel(types), default: rel(runtime) } : rel(runtime)

    if (DEEP_IMPORT_CATEGORIES.has(category)) {
      const runtimeExt = runtime.endsWith('.mjs') ? 'mjs' : runtime.endsWith('.ts') ? 'ts' : 'js'
      const runtimeGlob = `${rel(dir)}/*.${runtimeExt}`
      const typesGlob = types ? `${rel(dir)}/*.${types.endsWith('.d.mts') ? 'd.mts' : 'd.ts'}` : undefined
      entries[`./${category}/*`] = typesGlob ? { types: typesGlob, default: runtimeGlob } : runtimeGlob
    }
  }
  return entries
}

function stabilizePath(cwd: string, file: string): string {
  const relativePath = toRelativeKey(file, cwd)
  return relativePath && !relativePath.startsWith('..') ? relativePath : file
}

function designSystemArtifactSnapshot(loaded: LoadConfigResult): string {
  return JSON.stringify(
    loaded.metadata?.designSystem?.map((ds) => {
      const presetPath = resolvePath(dirname(ds.manifestPath), ds.manifest.preset)
      return {
        name: ds.name,
        specifier: ds.specifier,
        manifest: ds.manifest,
        manifestPath: ds.manifestPath,
        buildInfoPath: ds.buildInfoPath,
        manifestStamp: diskFileStamp(ds.manifestPath),
        buildInfoStamp: diskFileStamp(ds.buildInfoPath),
        presetStamp: diskFileStamp(presetPath),
        files: ds.files,
        tokenPaths: ds.tokenPaths,
      }
    }) ?? [],
  )
}

function diskFileStamp(path: string): string {
  try {
    const stat = statSync(path)
    return `${stat.mtimeMs}:${stat.size}`
  } catch {
    return 'missing'
  }
}

function realpathIfExists(compiler: Compiler, path: string): string {
  return compiler.fs.exists(path) ? compiler.path.realpath(path) : path
}

function designSystemFilesCwd(compiler: Compiler, manifestPath: string): string {
  return compiler.path.resolve(compiler.path.join([compiler.path.dirname(manifestPath), '..']))
}

function inferDesignSystemLibFiles(
  compiler: Compiler,
  cwd: string,
  filesBase: string,
  buildInfo: BuildInfoArtifact,
): string[] {
  const files = Object.keys(buildInfo.modules)
    .filter((key) => !key.startsWith('buildinfo:'))
    .map((key) => {
      const file = compiler.path.resolve(key, cwd)
      return toPosixRelative(filesBase, file)
    })

  return files.length > 0 ? [...new Set(files)] : DEFAULT_DESIGN_SYSTEM_LIB_FILES
}

function toGenerateArtifactOptions(options: CodegenOptions | undefined): GenerateArtifactOptions | undefined {
  return options?.forceImportExtension === undefined
    ? undefined
    : { forceImportExtension: options.forceImportExtension }
}
