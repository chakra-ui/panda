import type { ConfigResultWithHooks, TSConfig as _TSConfig } from '@pandacss/types'
import { getBaseEngine } from './base'
import { getJsxEngine } from './jsx'
import { getPathEngine } from './path'
import { HashFactory } from './hash-factory'
import { StyleCollector } from './styles-collector'
import { StaticCss } from './static-css'

export const getEngine = (conf: ConfigResultWithHooks) => {
  const { config } = conf
  const { forceConsistentTypeExtension, outExtension } = config

  const base = getBaseEngine(conf)
  const hashFactory = new HashFactory(base)
  const styleCollector = new StyleCollector(base)
  const staticCss = new StaticCss(base, { hash: hashFactory, styles: styleCollector })
  const collectStyles = () => styleCollector.collect(hashFactory)

  const engine = {
    hashFactory,
    styleCollector,
    collectStyles,
    jsx: getJsxEngine(config),
    paths: getPathEngine(config),
    staticCss,
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
