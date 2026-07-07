import { createUnplugin } from 'unplugin'
import { INTERNAL_CSS_RESOLVED_ID } from './runtime/internal/ids'
import { createPandaSourcePluginHooks, type PandaTransformerOptions } from './hooks'
import { shouldTransform } from './transform'

export type { PandaTransformerOptions } from './hooks'

export const pandaTransformer = createUnplugin<PandaTransformerOptions>((options) => {
  const { compiler: _compiler, getCompiler: _getCompiler, ...transformOptions } = options

  const hooks = createPandaSourcePluginHooks(() => ({
    ...transformOptions,
    compiler: options.compiler,
    getCompiler: options.getCompiler,
  }))

  return {
    name: 'pandacss-transformer',
    enforce: 'pre',
    ...hooks,
    loadInclude(id) {
      return id === INTERNAL_CSS_RESOLVED_ID
    },
    transformInclude(id) {
      return shouldTransform(id, transformOptions)
    },
  }
})

export default pandaTransformer
