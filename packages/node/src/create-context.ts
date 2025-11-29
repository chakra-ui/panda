import type { StyleEncoder, Stylesheet } from '@pandacss/core'
import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { ParserResult, Project } from '@pandacss/parser'
import { uniq } from '@pandacss/shared'
import type { LoadConfigResult, Runtime, WatchOptions, WatcherEventType } from '@pandacss/types'
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
    this.explicitDeps = this.getExplicitDependencies()
  }

  private getExplicitDependencies = () => {
    const { cwd, dependencies } = this.config
    if (!dependencies) return []
    return this.runtime.fs.glob({ include: dependencies, cwd })
  }

  initMessage = () => {
    return createBox({
      content: this.messages.codegenComplete(),
      title: this.messages.exclamation(),
    })
  }

  getFiles = () => {
    const { include, exclude, cwd } = this.config
    return this.runtime.fs.glob({ include, exclude, cwd })
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
      logger.error('file:extract', error)
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
