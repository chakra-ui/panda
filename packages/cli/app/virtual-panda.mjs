import { loadConfigFile } from '@pandacss/config'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

function vitePlugin() {
  return {
    name: 'vite:panda',
    async configureServer(viteServer) {
      const config = await loadConfigFile({ cwd: process.cwd() })
      const file = config.path
      viteServer.watcher.add(file).on('change', async () => {
        const module = viteServer.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) {
          await viteServer.reloadModule(module)
        }
      })

      viteServer.middlewares.use('/__peek', (req, res, next) => {
        console.log('req')
        next()
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

const virtualPanda = () => ({
  name: 'virtual:panda',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => {
      updateConfig({
        vite: {
          plugins: [vitePlugin()],
        },
      })
    },
  },
})

export default virtualPanda
