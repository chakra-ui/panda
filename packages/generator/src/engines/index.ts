import type { ConfigResultWithHooks, TSConfig as _TSConfig } from '@pandacss/types'
import { getBaseEngine } from './base'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { getPatternEngine } from './pattern'

export const getEngine = (conf: ConfigResultWithHooks) => ({
  ...getBaseEngine(conf),
  patterns: getPatternEngine(conf.config),
  jsx: getJsxEngine(conf.config),
  paths: getPathEngine(conf.config),
  file: {
    ext(file: string) {
      return `${file}.${conf.config.outExtension}`
    },
    extDts(file: string) {
      const dts = conf.config.outExtension === 'js' ? 'd.ts' : 'd.mts'
      return `${file}.${dts}`
    },
    import(mod: string, file: string) {
      return `import { ${mod} } from '${this.ext(file)}';`
    },
    importType(mod: string, file: string) {
      return `import type { ${mod} } from '${this.extDts(file)}';`
    },
    exportType(mod: string, file: string) {
      return `export type { ${mod} } from '${this.extDts(file)}';`
    },
    exportStar(file: string) {
      return `export * from '${this.ext(file)}';`
    },
    exportTypeStar(file: string) {
      return `export type * from '${this.extDts(file)}';`
    },
    isTypeFile(file: string) {
      return file.endsWith('.d.ts') || file.endsWith('.d.mts')
    },
  },
})

export type Context = ReturnType<typeof getEngine>
