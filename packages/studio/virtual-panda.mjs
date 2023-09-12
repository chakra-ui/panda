import { analyzeTokens, loadConfigAndCreateContext, writeAnalyzeJSON } from '@pandacss/node'
import { stringify } from 'javascript-stringify'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const _dirname = dirname(fileURLToPath(import.meta.url))
const analysisDataFilepath = 'src/lib/analysis.json'
const jsonPath = resolve(_dirname, analysisDataFilepath)

/**
 * @returns import('vite').VitePlugin
 */
function vitePlugin({ configPath }) {
  let config

  return {
    name: 'vite:panda',

    async configResolved() {
      const ctx = await loadConfigAndCreateContext({ configPath })
      config = ctx.config

      const result = analyzeTokens(ctx)
      await writeAnalyzeJSON(jsonPath, result, ctx)
    },

    async configureServer(server) {
      server.watcher.add(configPath)
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

/**
 * @returns import('astro').AstroIntegration
 */
const virtualPanda = () => ({
  name: 'virtual:panda',
  hooks: {
    'astro:config:setup': ({ updateConfig, addWatchFile }) => {
      const configPath = process.env.PUBLIC_CONFIG_PATH

      if (configPath) {
        addWatchFile(configPath)
      }

      updateConfig({
        vite: {
          plugins: [vitePlugin({ configPath })],
        },
      })
    },
  },
})

export default virtualPanda
