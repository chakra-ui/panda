import { CoreContext } from '@pandacss/core'
import type { ConfigResultWithHooks } from '@pandacss/types'
import { FileEngine } from './file'
import { JsxEngine } from './jsx'
import { PathEngine } from './path'

export class Context extends CoreContext {
  jsx: JsxEngine
  paths: PathEngine
  file: FileEngine

  constructor(public conf: ConfigResultWithHooks) {
    super(conf)
    const config = conf.config

    this.jsx = new JsxEngine(config)
    this.paths = new PathEngine(config)
    this.file = new FileEngine(config)
  }
}
