import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { createParserResult, createProject, type PandaProject } from '@pandacss/parser'
import type { ConfigResultWithHooks, Runtime } from '@pandacss/types'
import { getChunkEngine, type PandaChunksEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { PandaOutputEngine } from './output-engine'
import { DiffEngine } from './diff-engine'

export class PandaContext extends Generator {
  runtime: Runtime
  project: PandaProject
  getFiles: () => string[]
  chunks: PandaChunksEngine
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
      parserOptions: { join: this.runtime.path.join, ...this.parserOptions },
    })

    this.chunks = getChunkEngine(this)
    this.output = new PandaOutputEngine(this)
    this.diff = new DiffEngine(this)
  }

  appendFilesCss() {
    const files = this.getFiles()
    const filesWithCss: string[] = []

    const mergedResult = createParserResult()

    files.forEach((file) => {
      const measure = logger.time.debug(`Parsed ${file}`)
      const result = this.project.parseSourceFile(file)

      measure()
      if (!result) return

      mergedResult.merge(result)
      filesWithCss.push(file)
    })

    this.appendParserCss(mergedResult)

    return filesWithCss
  }
}
