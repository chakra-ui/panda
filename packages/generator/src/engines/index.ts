import type { ConfigResultWithHooks } from '@pandacss/types'
import { getBaseEngine, type PandaBaseEngine } from './base'
import { getFileEngine, type PandaFileEngine } from './file'
import { HashFactory } from './hash-factory'
import { getJsxEngine, type PandaJsxEngine } from './jsx'
import { getPathEngine, type PandaPathEngine } from './path'
import { StaticCss } from './static-css'
import { StyleCollector } from './style-collector'

export const getEngine = (conf: ConfigResultWithHooks): Context => {
  const { config } = conf

  const base = getBaseEngine(conf)
  const hashFactory = new HashFactory(base)
  const styleCollector = new StyleCollector(base)
  const staticCss = new StaticCss(base, { hash: hashFactory, styles: styleCollector })
  const collectStyles = () => styleCollector.collect(hashFactory)

  const engine = {
    hashFactory,
    styleCollector,
    collectStyles,
    staticCss,
    jsx: getJsxEngine(config),
    paths: getPathEngine(config),
    file: getFileEngine(config),
  }

  return Object.assign(base, engine)
}

export interface Context extends PandaBaseEngine {
  hashFactory: HashFactory
  styleCollector: StyleCollector
  staticCss: StaticCss
  collectStyles: () => StyleCollector
  jsx: PandaJsxEngine
  paths: PandaPathEngine
  file: PandaFileEngine
}
