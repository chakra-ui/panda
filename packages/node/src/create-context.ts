import type { Stylesheet } from '@pandacss/core'
import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { createProject, type PandaProject } from '@pandacss/parser'
import type { ConfigResultWithHooks, Runtime } from '@pandacss/types'
import { DiffEngine } from './diff-engine'
import { nodeRuntime } from './node-runtime'
import { PandaOutputEngine } from './output-engine'

export class PandaContext extends Generator {
  runtime: Runtime
  project: PandaProject
  getFiles: () => string[]
  output: PandaOutputEngine
  diff: DiffEngine

  constructor(conf: ConfigResultWithHooks) {
    super(conf)

    const config = conf.config
    this.runtime = nodeRuntime

    config.cwd ||= this.runtime.cwd()

    if (config.logLevel) {
      logger.level = config.logLevel
    }

    const { include, exclude, cwd } = config
    this.getFiles = () => this.runtime.fs.glob({ include, exclude, cwd })

    this.project = createProject({
      ...conf.tsconfig,
      getFiles: this.getFiles.bind(this),
      readFile: this.runtime.fs.readFileSync.bind(this),
      hooks: conf.hooks,
      // @ts-expect-error join is specified more than once
      parserOptions: { join: this.runtime.path.join, ...this.parserOptions },
    })

    this.output = new PandaOutputEngine(this)
    this.diff = new DiffEngine(this)
  }

  parseFiles(encoder = this.parserOptions.encoder) {
    const files = this.getFiles()
    const filesWithCss = [] as string[]

    files.forEach((file) => {
      const measure = logger.time.debug(`Parsed ${file}`)
      const result = this.project.parseSourceFile(file, encoder)

      measure()
      if (!result || this.encoder.isEmpty()) return

      filesWithCss.push(file)
    })

    return filesWithCss
  }

  async writeCss(sheet?: Stylesheet) {
    return this.output.write({
      id: 'styles.css',
      dir: this.paths.root,
      files: [{ file: 'styles.css', code: this.getCss(sheet) }],
    })
  }
}
