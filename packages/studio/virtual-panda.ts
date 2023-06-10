import { analyzeTokens, writeAnalyzeJSON, loadConfigAndCreateContext, findConfig } from '@pandacss/node'
import type { AstroIntegration } from 'astro'
import type { Plugin as VitePlugin } from 'vite'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const _dirname = dirname(fileURLToPath(import.meta.url))
const analysisDataFilepath = 'src/lib/analysis.json'
const jsonPath = resolve(_dirname, analysisDataFilepath)

function vitePlugin(): VitePlugin {
  let config

  return {
    name: 'vite:panda',
    async configResolved() {
      const ctx = await loadConfigAndCreateContext()
      config = ctx.config

      // const result = analyzeTokens(ctx)
      // await writeAnalyzeJSON(jsonPath, result, ctx)
    },
    async configureServer(server) {
      const file = config.path
      server.watcher.add(file).on('change', async () => {
        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) {
          await server.reloadModule(module)
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

const virtualPanda = (): AstroIntegration => ({
  name: 'virtual:panda',
  hooks: {
    'astro:config:setup': ({ updateConfig, addWatchFile }) => {
      const configPath = findConfig()

      if (configPath) {
        addWatchFile(configPath)
      }

      updateConfig({
        vite: {
          plugins: [vitePlugin()],
        },
      })
    },
  },
})

export default virtualPanda
