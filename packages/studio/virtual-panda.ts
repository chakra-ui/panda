import { type PandaContext, analyzeTokens, loadConfigAndCreateContext, writeAnalyzeJSON } from '@pandacss/node'
import { stringify } from 'javascript-stringify'
import type { AstroIntegration } from 'astro'
import type { PluginOption } from 'vite'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const _dirname = dirname(fileURLToPath(import.meta.url))
const analysisDataFilepath = 'src/lib/analysis.json'
const jsonPath = resolve(_dirname, analysisDataFilepath)

function vitePlugin(configPath: string): PluginOption {
  let config: PandaContext['config']

  async function loadPandaConfig() {
    const ctx = await loadConfigAndCreateContext({ configPath })
    config = ctx.config

    const result = analyzeTokens(ctx)
    await writeAnalyzeJSON(jsonPath, result, ctx)
  }
  return {
    name: 'vite:panda',

    async configureServer(server) {
      server.watcher.add(configPath).on('change', async (path) => {
        if (path !== configPath) return
        await loadPandaConfig()
        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) await server.reloadModule(module)
      })
    },

    async configResolved() {
      await loadPandaConfig()
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
          code: `export const config = ${stringify(config)}`,
        }
      }
    },
  }
}

const virtualPanda = (): AstroIntegration => ({
  name: 'virtual:panda',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => {
      const configPath = process.env.PUBLIC_CONFIG_PATH

      updateConfig({
        vite: {
          plugins: [vitePlugin(configPath!)],
        },
      })
    },
  },
})

export default virtualPanda
