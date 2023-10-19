import { createGenerator, type Generator } from '@pandacss/generator'
import { createProject, type Project } from '@pandacss/parser'
import type { ConfigResultWithHooks, PandaHookable } from '@pandacss/types'
import type { Runtime } from '@pandacss/types'
import { getChunkEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine } from './output-engine'
import { logger } from '@pandacss/logger'

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

  const ctx = {
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

  return Object.assign(ctx, { chunks: getChunkEngine(ctx), output: getOutputEngine(ctx) }) as PandaContext
}

export type PandaContext = Generator & {
  runtime: Runtime
  hooks: PandaHookable
  project: Project
  getFiles: () => string[]
  chunks: ReturnType<typeof getChunkEngine>
  output: ReturnType<typeof getOutputEngine>
}
