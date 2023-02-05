import type { LoadConfigResult } from '@pandacss/types'
import { getBaseEngine } from './base'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { getPatternEngine } from './pattern'
import { getRecipeEngine } from './recipe'

export const getEngine = (conf: LoadConfigResult) => ({
  ...getBaseEngine(conf),
  patterns: getPatternEngine(conf.config),
  recipes: getRecipeEngine(conf.config),
  jsx: getJsxEngine(conf.config),
  paths: getPathEngine(conf.config),
  file: {
    ext(file: string) {
      return `${file}.${conf.config.outExtension}`
    },
    import(mod: string, file: string) {
      return `import { ${mod} } from '${this.ext(file)}';`
    },
    export(file: string) {
      return `export * from '${this.ext(file)}';`
    },
  },
})

export type Context = ReturnType<typeof getEngine>
