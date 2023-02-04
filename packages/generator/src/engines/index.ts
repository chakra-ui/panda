import type { UserConfig } from '@pandacss/types'
import { getBaseEngine } from './base'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { getPatternEngine } from './pattern'
import { getRecipeEngine } from './recipe'

export const getEngine = (config: UserConfig) => ({
  ...getBaseEngine(config),
  patterns: getPatternEngine(config),
  recipes: getRecipeEngine(config),
  jsx: getJsxEngine(config),
  paths: getPathEngine(config),
  file: {
    ext(file: string) {
      return `${file}.${config.outExtension}`
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
