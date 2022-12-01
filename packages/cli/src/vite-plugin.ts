import { loadConfigFile } from '@pandacss/config'
import type { PluginOption } from 'vite'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export const pandaPlugin = (): PluginOption => {
  return {
    name: 'panda-plugin',
    async configureServer(viteServer) {
      const config = await loadConfigFile({ cwd: process.cwd() })
      const file = config.path
      viteServer.watcher.add(file).on('change', async () => {
        const module = viteServer.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) {
          await viteServer.reloadModule(module)
        }
      })
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return null
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = await loadConfigFile({ cwd: process.cwd() })
        return {
          code: `export const config = ${JSON.stringify(config.config)}`,
        }
      }
    },
  }
}
