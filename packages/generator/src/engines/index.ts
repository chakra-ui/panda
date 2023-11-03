import type { ConfigResultWithHooks, TSConfig as _TSConfig } from '@pandacss/types'
import { getBaseEngine, type PandaBaseEngine } from './base'
import { getJsxEngine, type PandaJsxEngine } from './jsx'
import { getPathEngine, type PandaPathEngine } from './path'
import { Patterns, type PandaPatternEngine } from './pattern'
import { getFileEngine, type PandaFileEngine } from './file'

export const getEngine = (conf: ConfigResultWithHooks): Context => {
  const { config } = conf
  return {
    ...getBaseEngine(conf),
    patterns: new Patterns(config),
    jsx: getJsxEngine(config),
    paths: getPathEngine(config),
    file: getFileEngine(config),
  }
}

export interface Context extends PandaBaseEngine {
  patterns: PandaPatternEngine
  jsx: PandaJsxEngine
  paths: PandaPathEngine
  file: PandaFileEngine
}
