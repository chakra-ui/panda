import type { ConfigResultWithHooks, TSConfig as _TSConfig } from '@pandacss/types'
import { getBaseEngine } from './base'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { getPatternEngine } from './pattern'

export const getEngine = (conf: ConfigResultWithHooks) => {
  const { config } = conf
  const forceConsistentTypeExtension = false
  return {
    ...getBaseEngine(conf),
    patterns: getPatternEngine(config),
    jsx: getJsxEngine(config),
    paths: getPathEngine(config),
    file: {
      ext(file: string) {
        return `${file}.${config.outExtension}`
      },
      extDts(file: string) {
        const dts = config.outExtension === 'mjs' && forceConsistentTypeExtension ? 'd.mts' : 'd.ts'
        return `${file}.${dts}`
      },
      __extDts(file: string) {
        return forceConsistentTypeExtension ? this.extDts(file) : file
      },
      import(mod: string, file: string) {
        return `import { ${mod} } from '${this.ext(file)}';`
      },
      importType(mod: string, file: string) {
        return `import type { ${mod} } from '${this.__extDts(file)}';`
      },
      exportType(mod: string, file: string) {
        return `export type { ${mod} } from '${this.__extDts(file)}';`
      },
      exportStar(file: string) {
        return `export * from '${this.ext(file)}';`
      },
      exportTypeStar(file: string) {
        return `export * from '${this.__extDts(file)}';`
      },
      isTypeFile(file: string) {
        return file.endsWith('.d.ts') || file.endsWith('.d.mts')
      },
    },
  }
}

export type Context = ReturnType<typeof getEngine>
