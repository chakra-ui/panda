import type { StyleEncoder, Stylesheet } from '@pandacss/core'
import { readLibManifest, type ReadLibManifestResult } from '@pandacss/config'
import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { ParserResult, Project } from '@pandacss/parser'
import { uniq } from '@pandacss/shared'
import type { EncoderJson, LoadConfigResult, Runtime, WatchOptions, WatcherEventType } from '@pandacss/types'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join } from 'node:path'
import { debounce } from 'perfect-debounce'
import { createBox } from './cli-box'
import { DiffEngine } from './diff-engine'
import { nodeRuntime } from './node-runtime'
import { OutputEngine } from './output-engine'

export class PandaContext extends Generator {
  runtime: Runtime
  project: Project
  output: OutputEngine
  diff: DiffEngine
  explicitDeps: string[] = []
  /** Absolute paths to design-system artifacts (manifest + buildinfo) that should trigger a rebuild when they change. Populated during designSystem hydration. */
  designSystemDepFiles: string[] = []

  constructor(conf: LoadConfigResult) {
    super(conf)

    const config = conf.config
    this.runtime = nodeRuntime

    config.cwd ||= this.runtime.cwd()

    if (config.logLevel) {
      logger.level = config.logLevel
    }

    this.project = new Project({
      ...conf.tsconfig,
      getFiles: this.getFiles.bind(this),
      readFile: this.runtime.fs.readFileSync.bind(this),
      hooks: conf.hooks,
      parserOptions: {
        ...this.parserOptions,
        join: this.runtime.path.join || this.parserOptions.join,
      },
    })

    this.output = new OutputEngine(this)
    this.diff = new DiffEngine(this)

    if (config.outdir && this.looksLikeBareSpecifier(config.outdir)) {
      logger.warn(
        'config',
        `outdir '${config.outdir}' looks like a bare package specifier, but it's interpreted as a relative directory path. ` +
          `Codegen will create a literal '${config.outdir}/' folder under cwd. ` +
          `Use a relative path ('./styled-system') and rely on package.json 'exports' / module resolution if you need a bare-specifier import path.`,
      )
    }

    if (config.designSystem) {
      this.hydrateDesignSystemEncoder(config.designSystem)
    }

    this.explicitDeps = this.getExplicitDependencies()
  }

  private hydrateDesignSystemEncoder(packageName: string) {
    const cwd = this.config.cwd ?? this.runtime.cwd()

    let manifestResult: ReadLibManifestResult
    try {
      manifestResult = readLibManifest(packageName, cwd)
    } catch (error) {
      logger.warn(
        'designSystem',
        `Could not load manifest for '${packageName}': ${(error as Error).message}. Skipping buildinfo hydration.`,
      )
      return
    }
    const { manifest, manifestPath } = manifestResult

    const buildinfoPath = isAbsolute(manifest.buildinfo)
      ? manifest.buildinfo
      : join(dirname(manifestPath), manifest.buildinfo)

    let buildinfoRaw: string
    try {
      buildinfoRaw = readFileSync(buildinfoPath, 'utf-8')
    } catch {
      // The manifest declared this buildinfo path, so a missing file means the
      // lib was shipped incomplete. Failing loudly avoids silently emitting CSS
      // that's missing the lib's pre-extracted classes.
      logger.error(
        'designSystem',
        `Manifest for '${packageName}' declares buildinfo at '${buildinfoPath}' but the file is missing. ` +
          `The lib's pre-extracted classes will NOT be hydrated and consumer CSS will be incomplete. ` +
          `Run 'panda lib' in the design system package to regenerate the buildinfo.`,
      )
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(buildinfoRaw)
    } catch {
      logger.error(
        'designSystem',
        `Buildinfo at '${buildinfoPath}' is not valid JSON. Skipping hydration — consumer CSS will be incomplete.`,
      )
      return
    }

    this.parserOptions.encoder.fromJSON(parsed as EncoderJson)

    // Register the manifest + buildinfo paths so a `panda --watch` consumer
    // picks up lib rebuilds (the lib's `panda lib --watch` rewrites these
    // files), and so `pnpm update @acme/lib` in a non-monorepo standalone app
    // triggers re-extraction on the next watcher event.
    this.designSystemDepFiles.push(manifestPath, buildinfoPath)

    this.checkVersionDrift(packageName, manifest.version)
  }

  /**
   * Compares the resolved lib version against the version recorded on the previous
   * codegen and logs a one-line receipt if they differ. Backward-looking only —
   * never queries any registry, never suggests an upgrade. Honors the consumer's
   * lockfile as the sole source of truth for which version is "current".
   */
  private checkVersionDrift(packageName: string, currentVersion: string) {
    const root = this.runtime.path.join(...this.paths.root)
    const stateFile = this.runtime.path.join(root, 'panda.designsystem-state.json')

    let state: { versions?: Record<string, string> } = {}
    if (existsSync(stateFile)) {
      try {
        state = JSON.parse(readFileSync(stateFile, 'utf-8')) ?? {}
      } catch {
        // Corrupted state — treat as no prior record. The write below will reset it.
      }
    }
    const versions = state.versions ?? {}

    const previous = versions[packageName]
    if (previous && previous !== currentVersion) {
      logger.info('designSystem', `${packageName}: ${previous} → ${currentVersion}`)
    }

    versions[packageName] = currentVersion
    try {
      mkdirSync(root, { recursive: true })
      writeFileSync(stateFile, JSON.stringify({ versions }, null, 2) + '\n', 'utf-8')
    } catch (error) {
      logger.warn('designSystem', `Could not persist version state to '${stateFile}': ${(error as Error).message}`)
    }
  }

  private getExplicitDependencies = () => {
    const { cwd, dependencies } = this.config
    const fromConfig = dependencies ? this.runtime.fs.glob({ include: dependencies, cwd }) : []
    return uniq([...fromConfig, ...this.designSystemDepFiles])
  }

  initMessage = () => {
    return createBox({
      content: this.messages.codegenComplete(),
      title: this.messages.exclamation(),
    })
  }

  getFiles = () => {
    const { include, exclude, cwd } = this.config

    const bareSpecifiers: string[] = []
    const pathGlobs: string[] = []
    for (const entry of include ?? []) {
      if (this.isBareSpecifier(entry)) {
        bareSpecifiers.push(entry)
      } else {
        pathGlobs.push(entry)
      }
    }

    const globFiles = this.runtime.fs.glob({ include: pathGlobs, exclude, cwd })

    const designSystemSpecs: string[] = []
    const specFiles: string[] = []
    const resolveCwd = cwd ?? this.runtime.cwd()
    for (const spec of bareSpecifiers) {
      const result = this.resolveBareSpecifier(spec, resolveCwd)
      if (result.kind === 'designSystem') {
        designSystemSpecs.push(spec)
      } else {
        specFiles.push(...result.files)
      }
    }

    if (designSystemSpecs.length > 0) {
      const list = designSystemSpecs.map((s) => `  - ${s}`).join('\n')
      const directive = designSystemSpecs.map((s) => `designSystem: ${JSON.stringify(s)}`).join(' / ')
      throw new Error(
        `The following packages in 'include' ship a 'panda.lib.json' manifest — they're Panda design systems, not scannable source packages:\n${list}\n` +
          `Remove them from 'include' and declare via ${directive} instead. ` +
          `'designSystem' hydrates pre-extracted styles from the lib's buildinfo; 'include' re-scans source files, which is redundant and wrong for a design system.`,
      )
    }

    return [...globFiles, ...specFiles]
  }

  private looksLikeBareSpecifier(entry: string): boolean {
    return this.isBareSpecifier(entry) && (entry.startsWith('@') || /^[a-z][a-z0-9-]*\//i.test(entry))
  }

  private isBareSpecifier(entry: string): boolean {
    if (entry.startsWith('./') || entry.startsWith('../') || entry.startsWith('/')) return false
    if (/^[a-zA-Z]:/.test(entry)) return false
    if (entry.includes('*') || entry.includes('?') || entry.includes('{') || entry.includes('[')) return false
    return true
  }

  private resolveBareSpecifier(
    spec: string,
    cwd: string,
  ): { kind: 'designSystem' } | { kind: 'files'; files: string[] } {
    const require = createRequire(join(cwd, 'package.json'))

    try {
      require.resolve(`${spec}/panda.lib.json`)
      return { kind: 'designSystem' }
    } catch (e: any) {
      if (e?.code !== 'MODULE_NOT_FOUND' && e?.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
        throw e
      }
    }

    let pkgJsonPath: string
    try {
      pkgJsonPath = require.resolve(`${spec}/package.json`)
    } catch {
      try {
        const mainEntry = require.resolve(spec)
        let dir = dirname(mainEntry)
        let found: string | undefined
        while (true) {
          const candidate = join(dir, 'package.json')
          if (this.runtime.fs.existsSync(candidate)) {
            found = candidate
            break
          }
          const parent = dirname(dir)
          if (parent === dir) break
          dir = parent
        }
        if (!found) {
          throw new Error('package.json not found by walk-up')
        }
        pkgJsonPath = found
      } catch {
        logger.warn(
          'smartInclude',
          `Cannot resolve bare specifier '${spec}' — neither a panda.lib.json nor a package.json (or main entry) found. Skipping.`,
        )
        return { kind: 'files', files: [] }
      }
    }

    const pkgRoot = dirname(pkgJsonPath)
    const pkg = JSON.parse(this.runtime.fs.readFileSync(pkgJsonPath))

    // Smart-include scope: when a package declares a `dist`-ish entry in its
    // `files` array, restrict the glob to that — including `src/` would parse
    // the lib's TypeScript source AND its compiled output, doubling extract
    // work and risking duplicate styles. Fall back to the broader files-array
    // walk only when there's no recognizable build output to target.
    const fileEntries: string[] = Array.isArray(pkg.files) ? pkg.files : []
    const distEntry = fileEntries.find((f: string) => f === 'dist' || f.startsWith('dist/'))
    const fileGlobs: string[] = distEntry
      ? [distEntry.includes('.') ? distEntry : `${distEntry}/**/*.{js,mjs,cjs}`]
      : fileEntries.length > 0
        ? fileEntries.map((f: string) => {
            const lastSegment = f.split('/').pop() ?? ''
            const isFilePath = lastSegment.includes('.')
            return isFilePath ? f : `${f}/**/*.{js,mjs,cjs,ts,tsx}`
          })
        : ['dist/**/*.{js,mjs,cjs}']

    return { kind: 'files', files: this.runtime.fs.glob({ include: fileGlobs, cwd: pkgRoot }) }
  }

  parseFile = (filePath: string, styleEncoder?: StyleEncoder) => {
    const file = this.runtime.path.abs(this.config.cwd, filePath)
    logger.debug('file:extract', file)

    const measure = logger.time.debug(`Parsed ${file}`)

    let result: ParserResult | undefined

    try {
      const encoder = styleEncoder || this.parserOptions.encoder
      result = this.project.parseSourceFile(file, encoder)
    } catch (error) {
      logger.caughtError('file:extract', `Failed to parse ${file}`, error)
    }

    measure()
    return result
  }

  parseFiles = (styleEncoder?: StyleEncoder) => {
    const encoder = styleEncoder || this.parserOptions.encoder

    const files = this.getFiles()
    const filesWithCss = [] as string[]
    const results = [] as ParserResult[]

    files.forEach((file) => {
      const measure = logger.time.debug(`Parsed ${file}`)
      const result = this.project.parseSourceFile(file, encoder)

      measure()
      if (!result || result.isEmpty() || encoder.isEmpty()) return

      filesWithCss.push(file)
      results.push(result)
    })

    return {
      filesWithCss,
      files,
      results,
    }
  }

  writeCss = (sheet?: Stylesheet) => {
    logger.info('css', this.runtime.path.join(...this.paths.root, 'styles.css'))
    return this.output.write({
      id: 'styles.css',
      dir: this.paths.root,
      files: [{ file: 'styles.css', code: this.getCss(sheet) }],
    })
  }

  writeSplitCss = async (sheet: Stylesheet) => {
    const { path: pathUtil, fs } = this.runtime
    const rootDir = this.paths.root
    const stylesDir = [...rootDir, 'styles']

    // Get all artifacts from the generator
    const artifacts = this.getSplitCssArtifacts(sheet)

    // Derive and create directories from artifacts
    const subDirs = new Set([...artifacts.recipes, ...artifacts.themes].map((a) => a.dir).filter(Boolean))
    fs.ensureDirSync(pathUtil.join(...stylesDir))
    subDirs.forEach((dir) => fs.ensureDirSync(pathUtil.join(...stylesDir, dir!)))

    // Collect all files for batched write
    const styleFiles: Array<{ file: string; code: string }> = []

    // Layer files
    for (const layer of artifacts.layers) {
      styleFiles.push({ file: layer.file, code: layer.code })
      logger.info('css', pathUtil.join(...stylesDir, layer.file))
    }

    // Recipe files
    for (const recipe of artifacts.recipes) {
      styleFiles.push({ file: `${recipe.dir}/${recipe.file}`, code: recipe.code })
      logger.info('css', pathUtil.join(...stylesDir, recipe.dir!, recipe.file))
    }

    // Recipes index
    if (artifacts.recipes.length) {
      styleFiles.push({ file: 'recipes.css', code: artifacts.recipesIndex })
      logger.info('css', pathUtil.join(...stylesDir, 'recipes.css'))
    }

    // Theme files
    for (const theme of artifacts.themes) {
      styleFiles.push({ file: `${theme.dir}/${theme.file}`, code: theme.code })
      logger.info('css', pathUtil.join(...stylesDir, theme.dir!, theme.file))
    }

    // Write all split files to styles/ directory
    await this.output.write({
      id: 'styles',
      dir: stylesDir,
      files: styleFiles,
    })

    // Write main styles.css
    logger.info('css', pathUtil.join(...rootDir, 'styles.css'))
    await this.output.write({
      id: 'styles.css',
      dir: rootDir,
      files: [{ file: 'styles.css', code: artifacts.index }],
    })
  }

  watchConfig = (cb: (file: string) => void | Promise<void>, opts?: Omit<WatchOptions, 'include'>) => {
    const { cwd, poll, exclude } = opts ?? {}
    logger.info('ctx:watch', this.messages.configWatch())

    const watcher = this.runtime.fs.watch({
      include: uniq([...this.explicitDeps, ...this.conf.dependencies]),
      exclude,
      cwd,
      poll,
    })

    watcher.on(
      'change',
      debounce(async (file) => {
        logger.info('ctx:change', 'config changed, rebuilding...')
        await cb(file)
      }),
    )
  }

  watchFiles = (
    cb: (event: WatcherEventType, file: string) => void | Promise<void>,
    opts?: Omit<WatchOptions, 'include' | 'exclude' | 'poll' | 'cwd' | 'logger'>,
  ) => {
    const { include, exclude, poll, cwd } = this.config
    logger.info('ctx:watch', this.messages.watch())

    const watcher = this.runtime.fs.watch({
      ...opts,
      include,
      exclude,
      poll,
      cwd,
    })

    watcher.on(
      'all',
      debounce(async (event, file) => {
        logger.info(`file:${event}`, file)
        await cb(event, file)
      }),
    )
  }
}
