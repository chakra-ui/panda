import type { Plugin } from 'vite'
import type { PandaViteOptions } from '../index'
import type { Root } from '../root'
import { RESOLVED_VIRTUAL_MODULE_ID, VIRTUAL_MODULE_ID } from '../virtual'

export function createBuildPlugin(_options: PandaViteOptions, state: { root: Root | null }): Plugin {
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
  }
}
