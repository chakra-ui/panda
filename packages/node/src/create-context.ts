import { createGenerator, type Generator } from '@pandacss/generator'
import { createProject, type PandaProject } from '@pandacss/parser'
import type { ConfigResultWithHooks, PandaHookable, Runtime } from '@pandacss/types'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine } from './output-engine'
import { logger } from '@pandacss/logger'
import { type PandaOutputEngine } from './output-engine'

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
      // @ts-expect-error
      parserOptions: { join: runtime.path.join, ...generator.parserOptions },
    }),
  }

  return Object.assign(ctx, { output: getOutputEngine(ctx) }) as PandaContext
}

export interface PandaContext extends Generator {
  runtime: Runtime
  hooks: PandaHookable
  project: PandaProject
  getFiles: () => string[]
  output: PandaOutputEngine
}
