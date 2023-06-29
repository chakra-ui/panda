import { createGenerator, type Generator } from '@pandacss/generator'
import { createProject, type Project } from '@pandacss/parser'
import type { ConfigResultWithHooks, PandaHookable } from '@pandacss/types'
import type { Runtime } from '@pandacss/types/src/runtime'
import { Obj, pipe, tap } from 'lil-fp'
import { getChunkEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine } from './output-engine'

export const createContext = (conf: ConfigResultWithHooks) =>
  pipe(
    conf,
    createGenerator,

    Obj.assign({ runtime: nodeRuntime, hooks: conf.hooks }),

    tap(({ config, runtime }) => {
      config.cwd ||= runtime.cwd()
    }),

    Obj.bind('getFiles', ({ config, runtime: { fs } }) => () => {
      const { include, exclude, cwd } = config
      return fs.glob({ include, exclude, cwd })
    }),

    Obj.bind('project', ({ getFiles, runtime: { fs }, parserOptions }) => {
      return createProject({
        ...conf.tsconfig,
        getFiles,
        readFile: fs.readFileSync,
        hooks: conf.hooks,
        parserOptions,
      })
    }),

    Obj.bind('chunks', getChunkEngine),

    Obj.bind('output', getOutputEngine),
  ) as PandaContext

export type PandaContext = Generator & {
  runtime: Runtime
  hooks: PandaHookable
  project: Project
  getFiles: () => string[]
  chunks: ReturnType<typeof getChunkEngine>
  output: ReturnType<typeof getOutputEngine>
}
