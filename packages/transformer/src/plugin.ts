import { createUnplugin } from 'unplugin'
import { INTERNAL_CSS_RESOLVED_ID } from './runtime/internal/ids'
import { createPandaSourcePluginHooks, type PandaTransformerOptions } from './hooks'
import { shouldTransform, stripSfcQuery } from './transform'

export type { PandaTransformerOptions } from './hooks'

export const pandaTransformer = createUnplugin<PandaTransformerOptions>((options, meta) => {
  const {
    compiler: _compiler,
    transformer: _transformer,
    getCompiler: _getCompiler,
    getTransformer: _getTransformer,
    ...transformOptions
  } = options

  const hooks = createPandaSourcePluginHooks(() => ({
    ...transformOptions,
    compiler: options.compiler,
    transformer: options.transformer,
    getCompiler: options.getCompiler,
    getTransformer: options.getTransformer,
  }))

  const loadsWholeSfc = meta.framework === 'webpack' || meta.framework === 'rspack'
  const toId = (id: string) => (loadsWholeSfc ? stripSfcQuery(id) : id)

  return {
    name: 'pandacss-transformer',
    enforce: 'pre',
    ...hooks,
    transform(code, id) {
      return hooks.transform.call(this, code, toId(id))
    },
    loadInclude(id) {
      return id === INTERNAL_CSS_RESOLVED_ID
    },
    transformInclude(id) {
      return shouldTransform(toId(id), transformOptions)
    },
  }
})

export default pandaTransformer
