import type { StyleEncoder, Stylesheet } from '@pandacss/core'
import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { ParserResult, Project } from '@pandacss/parser'
import type { ConfigResultWithHooks, Runtime, WatchOptions, WatcherEventType } from '@pandacss/types'
import { debounce } from 'perfect-debounce'
import { DiffEngine } from './diff-engine'
import { nodeRuntime } from './node-runtime'
import { OutputEngine } from './output-engine'

export class PandaContext extends Generator {
  runtime: Runtime
  project: Project
  output: OutputEngine
  diff: DiffEngine

  constructor(conf: ConfigResultWithHooks) {
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
    return this.output.write({
      id: 'styles.css',
      dir: this.paths.root,
      files: [{ file: 'styles.css', code: this.getCss(sheet) }],
    })
  }

  watchConfig = (cb: () => void | Promise<void>, opts?: Omit<WatchOptions, 'include'>) => {
    const { cwd, poll, exclude } = opts ?? {}
    logger.info('ctx:watch', this.messages.configWatch())

    const watcher = this.runtime.fs.watch({
      include: this.conf.dependencies,
      exclude,
      cwd,
      poll,
    })

    watcher.on(
      'change',
      debounce(async () => {
        logger.info('ctx:change', 'config changed, rebuilding...')
        await cb()
      }),
    )
  }

  watchFiles = (cb: (event: WatcherEventType, file: string) => void | Promise<void>) => {
    const { include, exclude, poll, cwd } = this.config
    logger.info('ctx:watch', this.messages.watch())

    const watcher = this.runtime.fs.watch({
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
