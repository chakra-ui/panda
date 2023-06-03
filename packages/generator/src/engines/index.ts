import type { LoadConfigResult } from '@pandacss/types'
import { getBaseEngine, type BaseEngine } from './base'
import { getJsxEngine, type JsxEngine } from './jsx'
import { getPathEngine, type PathEngine } from './path'
import { getPatternEngine, type PatternEngine } from './pattern'

export const getEngine = (conf: LoadConfigResult) =>
  ({
    ...getBaseEngine(conf),
    patterns: getPatternEngine(conf.config),
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
  } as Context)

export type Context = BaseEngine & {
  patterns: PatternEngine
  jsx: JsxEngine
  paths: PathEngine
  file: {
    ext(file: string): string
    import(mod: string, file: string): string
    export(file: string): string
  }
}
