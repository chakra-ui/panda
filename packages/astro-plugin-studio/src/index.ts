import { loadConfigAndCreateContext, type PandaContext } from '@pandacss/node'
import { stringify as stringifyPanda } from '@pandacss/core'
import type { AstroIntegration } from 'astro'
import { stringify } from 'javascript-stringify'
import type { PluginOption } from 'vite'

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

function vitePlugin(configPath: string): PluginOption {
  let config: PandaContext['config']
  const textStyleMap: Record<string, string> = {}
  const layerStyleMap: Record<string, string> = {}

  async function loadPandaConfig() {
    const ctx = await loadConfigAndCreateContext({ configPath })
    for (const key of Object.keys(ctx.config.theme?.textStyles ?? {})) {
      const utility = ctx.utility.transform('textStyle', key)
      textStyleMap[key] = stringifyPanda(utility.styles)
    }
    for (const key of Object.keys(ctx.config.theme?.layerStyles ?? {})) {
      const utility = ctx.utility.transform('layerStyle', key)
      layerStyleMap[key] = stringifyPanda(utility.styles)
    }
    config = ctx.config
  }

  return {
    name: '@pandacss/studio',

    async configureServer(server) {
      server.watcher.add(configPath).on('change', async (path) => {
        if (path !== configPath) return
        await loadPandaConfig()
        const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) await server.reloadModule(module)
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
        await loadPandaConfig()
        return {
          code: [
            `export const config = ${stringify(config)}`,
            `export const textStyles = ${stringify(textStyleMap)}`,
            `export const layerStyles = ${stringify(layerStyleMap)}`,
          ].join('\n\n'),
        }
      }
    },
  }
}

const pandaStudio = (): AstroIntegration => ({
  name: '@pandacss/studio',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => {
      const configPath = process.env.PUBLIC_CONFIG_PATH

      updateConfig({
        vite: {
          // @ts-ignore
          plugins: [vitePlugin(configPath!)],
        },
      })
    },
  },
})

export default pandaStudio
