import type { Plugin, ViteDevServer } from 'vite'
import type { PandaViteOptions } from '../index'
import type { Root } from '../root'
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from '../virtual'

const defaultInclude = /\.[cm]?[jt]sx?$/
const defaultExclude = /node_modules|styled-system/

export function createServePlugin(
  options: PandaViteOptions,
  state: { root: Root | null; server: ViteDevServer | null },
): Plugin {
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
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return state.root?.generateCss() ?? ''
      }
    },

    transform(code, id) {
      if (!shouldTransform(id)) return
      if (!state.root) return

      const hasNew = state.root.extractFile(id)

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
    },
  }
}
