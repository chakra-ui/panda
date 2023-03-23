import { loadConfigFile } from '@pandacss/config'
import { analyzeTokens, writeAnalyzeJSON, createContext } from '@pandacss/node'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const _dirname = dirname(fileURLToPath(import.meta.url))
const analysisDataFilepath = 'src/utils/analysis.json'
const jsonPath = resolve(_dirname, analysisDataFilepath)

function vitePlugin() {
  let config

  return {
    name: 'vite:panda',
    async configResolved() {
      config = await loadConfigFile({ cwd: process.cwd() })

      const ctx = createContext(config)
      const result = analyzeTokens(ctx, 'box-extractor')

      await writeAnalyzeJSON(jsonPath, result, ctx)
    },
    async configureServer(viteServer) {
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
