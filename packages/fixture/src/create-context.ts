import { createGenerator } from '@pandacss/generator'
import type { Config, UserConfig } from '@pandacss/types'
import { generatorConfig } from './generator'
import { mergeConfigs } from '@pandacss/config'

const defaults = generatorConfig
export const createContext = (userConfig?: Config) => {
  const resolvedConfig = (userConfig ? mergeConfigs([defaults.config, userConfig]) : defaults.config) as UserConfig
  const generator = createGenerator({ ...defaults, config: resolvedConfig })
  // const config = conf.config

  // config.cwd ||= runtime.cwd()

  // const { include, exclude, cwd } = config
  // const getFiles = () => runtime.fs.glob({ include, exclude, cwd })

  const ctx = {
    ...resolvedConfig,
    ...generator,
    runtime: {},
    hooks: resolvedConfig.hooks,
    // getFiles,
    // project: createProject({
    //   ...conf.tsconfig,
    //   getFiles,
    //   readFile: () => {},
    //   hooks: conf.hooks,
    //   // @ts-expect-error
    //   parserOptions: { join: runtime.path.join, ...generator.parserOptions },
    // }),
  }

  return ctx

  // return Object.assign(ctx, { output: getOutputEngine(ctx) }) as PandaContext
}

// export const createContext = (userConfig?: Config) => {
//   const resolvedConfig = userConfig ? mergeConfigs([defaults.config, userConfig]) : defaults.config

//   const generator = createGenerator(generatorConfig)
//   const config = conf.config
//   const runtime = nodeRuntime

//   const ctx = {
//     ...conf,
//     ...generator,
//     runtime: nodeRuntime,
//     hooks: conf.hooks,
//     getFiles,
//     project: createProject({
//     //   ...conf.tsconfig,
//     //   getFiles,
//     //   readFile: runtime.fs.readFileSync,
//     //   hooks: conf.hooks,
//     //   // @ts-expect-error
//     //   parserOptions: { join: runtime.path.join, ...generator.parserOptions },
//     // }),
//   }

//   return {
//     hash,
//     root: postcss.root(),
//     conditions: conditions,
//     utility: utility,
//     helpers: { map: () => '' },
//     layersNames: defaultLayers,
//   }
// }
