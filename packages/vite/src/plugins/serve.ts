import MagicString from 'magic-string'
import type { Plugin } from 'vite'
import type { PandaViteOptions, PluginState } from '../index'
import { getRoot } from '../index'
import { inlineFile } from '../inline'
import { stripQuery } from '../utils'
import {
  matchResolvedVirtualModule,
  matchVirtualModule,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from '../virtual'

const defaultInclude = /\.[cm]?[jt]sx?$/
const defaultExclude = /node_modules|styled-system/

export function createServePlugin(options: PandaViteOptions, state: PluginState): Plugin {
  const include = options.include ? ([] as RegExp[]).concat(options.include) : [defaultInclude]
  const exclude = options.exclude ? ([] as RegExp[]).concat(options.exclude) : [defaultExclude]

  function shouldTransform(id: string): boolean {
    const cleanId = id.split('?')[0]
    if (exclude.some((re) => re.test(cleanId))) return false
    return include.some((re) => re.test(cleanId))
  }

  return {
    name: '@pandacss/vite:serve',
    apply: 'serve',
    enforce: 'pre',

    resolveId(id) {
      if (matchVirtualModule(id) != null) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (matchResolvedVirtualModule(id) == null) return

      const root = getRoot(state)
      if (!root) return ''

      const css = root.generateCss({ skipLightningCss: state.viteUsesLightningCss })

      // Generate source map for CSS when Vite's devSourcemap is enabled
      if (state.config?.css?.devSourcemap) {
        const ms = new MagicString(css)
        return {
          code: css,
          map: ms.generateMap({ source: VIRTUAL_MODULE_ID, hires: true, includeContent: true }),
        }
      }

      return css
    },

    transform(code, id) {
      if (!shouldTransform(id)) return

      const root = getRoot(state)
      if (!root) return

      const cleanId = stripQuery(id)
      const { hasNew, result } = root.extractFile(cleanId)

      // Inline compiler (Phase 2): replace css()/pattern() calls with className strings
      let transformResult: { code: string; map: any } | undefined
      if (options.optimizeJs !== false && result && !result.isEmpty()) {
        transformResult = inlineFile(code, cleanId, result, root.ctx)
      }

      // HMR: invalidate virtual CSS module when new styles are discovered
      if (hasNew && state.server) {
        const mod = state.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          state.server.moduleGraph.invalidateModule(mod)
          state.server.hot.send({
            type: 'update',
            updates: [
              {
                type: 'css-update',
                path: VIRTUAL_MODULE_ID,
                acceptedPath: VIRTUAL_MODULE_ID,
                timestamp: Date.now(),
              },
            ],
          })
        }
      }

      return transformResult
    },
  }
}
