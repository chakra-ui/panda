import { analyzeTokens, writeAnalyzeJSON, loadConfigAndCreateContext } from '@pandacss/node'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const _dirname = dirname(fileURLToPath(import.meta.url))
const analysisDataFilepath = 'src/lib/analysis.json'
const jsonPath = resolve(_dirname, analysisDataFilepath)

function vitePlugin() {
  let config

  return {
    name: 'vite:panda',
    async configResolved() {
      const ctx = await loadConfigAndCreateContext()
      config = ctx.config

      // const result = analyzeTokens(ctx)
      // await writeAnalyzeJSON(jsonPath, result, ctx)
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
        return {
          code: `export const config = ${JSON.stringify(config)}`,
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
