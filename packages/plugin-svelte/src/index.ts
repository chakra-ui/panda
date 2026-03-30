import type { PandaPlugin } from '@pandacss/types'
import { svelteToTsx } from './svelte-to-tsx'

export { svelteToTsx }

export function pluginSvelte(): PandaPlugin {
  return {
    name: '@pandacss/plugin-svelte',
    hooks: {
      'parser:before': ({ filePath, content }) => {
        if (filePath.endsWith('.svelte')) {
          return svelteToTsx(content)
        }
      },
    },
  }
}
