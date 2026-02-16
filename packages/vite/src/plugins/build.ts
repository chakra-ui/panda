import type { Plugin } from 'vite'
import type { PandaViteOptions, PluginState } from '../index'
import { getRoot } from '../index'
import { inlineFile } from '../inline'
import { normalizePath, stripQuery } from '../utils'
import { matchResolvedVirtualModule, matchVirtualModule, RESOLVED_VIRTUAL_MODULE_ID } from '../virtual'

const defaultInclude = /\.[cm]?[jt]sx?$/
const defaultExclude = /node_modules|styled-system/

export function createBuildPlugin(options: PandaViteOptions, state: PluginState): Plugin {
  const include = options.include ? ([] as RegExp[]).concat(options.include) : [defaultInclude]
  const exclude = options.exclude ? ([] as RegExp[]).concat(options.exclude) : [defaultExclude]

  function shouldTransform(id: string): boolean {
    const cleanId = id.split('?')[0]
    if (exclude.some((re) => re.test(cleanId))) return false
    return include.some((re) => re.test(cleanId))
  }

  return {
    name: '@pandacss/vite:build',
    apply: 'build',
    enforce: 'pre',

    resolveId(id) {
      if (matchVirtualModule(id) != null) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (matchResolvedVirtualModule(id) == null) return

      const envName = (this as any).environment?.name
      const root = getRoot(state, envName)
      if (!root) return ''

      return root.generateCss({ skipLightningCss: state.viteUsesLightningCss })
    },

    transform(code, id) {
      if (!shouldTransform(id)) return
      if (options.optimizeJs === false) return

      const envName = (this as any).environment?.name
      const root = getRoot(state, envName)
      if (!root) return

      // Strip query and normalize path for parseResults lookup
      const cleanId = normalizePath(stripQuery(id))

      // Look up cached ParserResult from buildStart's parseFiles()
      const result = root.parseResults.get(cleanId)
      if (!result || result.isEmpty()) return

      return inlineFile(code, cleanId, result, root.ctx)
    },
  }
}
