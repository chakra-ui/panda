import { createGenerator, type Generator } from '@pandacss/generator'
import { createProject, type Project } from '@pandacss/parser'
import type { LoadConfigResult } from '@pandacss/types'
import type { Runtime } from '@pandacss/types/src/runtime'
import { Obj, pipe, tap } from 'lil-fp'
import { getChunkEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine } from './output-engine'

export const createContext = (conf: LoadConfigResult) =>
  pipe(
    conf,
    createGenerator,

    Obj.assign({ runtime: nodeRuntime }),

    tap(({ config, runtime }) => {
      config.cwd ||= runtime.cwd()
    }),

    Obj.bind('getFiles', ({ config, runtime: { fs } }) => () => {
      const { include, exclude, cwd } = config
      return fs.glob({ include, exclude, cwd })
    }),

    Obj.bind('project', ({ getFiles, runtime: { fs }, parserOptions }) => {
      return createProject({
        getFiles,
        readFile: fs.readFileSync,
        parserOptions,
      })
    }),

    Obj.bind('chunks', getChunkEngine),

    Obj.bind('output', getOutputEngine),
  ) as PandaContext

export type PandaContext = Generator & {
  runtime: Runtime
  project: Project
  getFiles: () => string[]
  chunks: ReturnType<typeof getChunkEngine>
  output: ReturnType<typeof getOutputEngine>
}
