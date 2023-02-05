import { createGenerator, Generator } from '@pandacss/generator'
import { createProject, Project } from '@pandacss/parser'
import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe, tap } from 'lil-fp'
import { getChunkEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine } from './output-engine'
import type { Runtime } from '@pandacss/types/src/runtime'

const getImportMap = (outdir: string) => ({
  css: `${outdir}/css`,
  recipe: `${outdir}/recipes`,
  pattern: `${outdir}/patterns`,
  jsx: `${outdir}/jsx`,
})

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

    Obj.bind(
      'project',
      ({ getFiles, config: { outdir }, runtime: { fs }, jsx, patterns, recipes, isValidProperty }) => {
        return createProject({
          getFiles,
          readFile: fs.readFileSync,
          parserOptions: {
            importMap: getImportMap(outdir),
            jsx: {
              factory: jsx.factoryName,
              isStyleProp: isValidProperty,
              nodes: [...patterns.nodes, ...recipes.nodes],
            },
          },
        })
      },
    ),

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
