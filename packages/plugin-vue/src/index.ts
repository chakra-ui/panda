import type { PandaPlugin } from '@pandacss/types'
import { vueToTsx } from './vue-to-tsx'

export { vueToTsx }

export function pluginVue(): PandaPlugin {
  return {
    name: '@pandacss/plugin-vue',
    hooks: {
      'parser:before': ({ filePath, content }) => {
        if (filePath.endsWith('.vue')) {
          return vueToTsx(content)
        }
      },
    },
  }
}
