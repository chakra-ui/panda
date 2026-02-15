import { normalize } from 'path'
import type { Plugin } from 'vite'
import type { PandaViteOptions } from '../index'
import { inlineFile } from '../inline'
import type { Root } from '../root'
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from '../virtual'

const defaultInclude = /\.[cm]?[jt]sx?$/
const defaultExclude = /node_modules|styled-system/

export function createBuildPlugin(options: PandaViteOptions, state: { root: Root | null }): Plugin {
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
      if (options.optimizeJs === false) return

      // Look up cached ParserResult from buildStart's parseFiles()
      const result = state.root.parseResults.get(normalize(id))
      if (!result || result.isEmpty()) return

      return inlineFile(code, id, result, state.root.ctx)
    },
  }
}
