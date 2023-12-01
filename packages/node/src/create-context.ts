import { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { createProject, type PandaProject } from '@pandacss/parser'
import type { ConfigResultWithHooks, Runtime } from '@pandacss/types'
import { nodeRuntime } from './node-runtime'
import { PandaOutputEngine } from './output-engine'
import { DiffEngine } from './diff-engine'

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
}
