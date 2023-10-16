import type { ConfigResultWithHooks, TSConfig as _TSConfig } from '@pandacss/types'
import { getBaseEngine } from './base'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { HashCollector } from './hash-collector'
import { StylesCollector } from './styles-collector'
import { generateStaticCss } from './static-css'

export const getEngine = (conf: ConfigResultWithHooks) => {
  const { config } = conf
  const { forceConsistentTypeExtension, outExtension } = config

  const base = getBaseEngine(conf)
  const hashCollector = new HashCollector(base)
  const stylesCollector = new StylesCollector(base)

  const engine = {
    hashCollector,
    stylesCollector,
    jsx: getJsxEngine(config),
    paths: getPathEngine(config),
    staticCss: generateStaticCss(base, { hash: hashCollector, styles: stylesCollector }),
    file: {
      ext(file: string) {
        return `${file}.${outExtension}`
      },
      extDts(file: string) {
        const dts = outExtension === 'mjs' && forceConsistentTypeExtension ? 'd.mts' : 'd.ts'
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

  return Object.assign(base, engine)
}

export interface Context extends ReturnType<typeof getEngine> {}
