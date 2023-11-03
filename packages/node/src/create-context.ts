import { createGenerator, type Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { createProject, type PandaProject } from '@pandacss/parser'
import type { ConfigResultWithHooks, PandaHookable, Runtime } from '@pandacss/types'
import { getChunkEngine, type PandaChunksEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine, type PandaOutputEngine } from './output-engine'
import { DiffEngine } from './diff-engine'

export const createContext = (conf: ConfigResultWithHooks) => {
  const generator = createGenerator(conf)
  const config = conf.config
  const runtime = nodeRuntime

  config.cwd ||= runtime.cwd()

  if (config.logLevel) {
    logger.level = config.logLevel
  }

  const { include, exclude, cwd } = config
  const getFiles = () => runtime.fs.glob({ include, exclude, cwd })

  const base_ctx = {
    ...conf,
    ...generator,
    runtime: nodeRuntime,
    hooks: conf.hooks,
    getFiles,
    project: createProject({
      ...conf.tsconfig,
      getFiles,
      readFile: runtime.fs.readFileSync,
      hooks: conf.hooks,
      parserOptions: { join: runtime.path.join, ...generator.parserOptions },
    }),
  }
  const ctx = Object.assign(base_ctx, {
    chunks: getChunkEngine(base_ctx),
    output: getOutputEngine(base_ctx),
    diff: new DiffEngine(base_ctx),
  }) as PandaContext

  return ctx
}

export interface PandaContext extends Generator {
  runtime: Runtime
  hooks: PandaHookable
  project: PandaProject
  getFiles: () => string[]
  chunks: PandaChunksEngine
  output: PandaOutputEngine
  diff: DiffEngine
}
