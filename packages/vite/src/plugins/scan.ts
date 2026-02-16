import { logger } from '@pandacss/logger'
import type { Plugin } from 'vite'
import type { PandaViteOptions, PluginState } from '../index'
import { getRoot } from '../index'
import { Root } from '../root'
import { normalizePath } from '../utils'
import { RESOLVED_VIRTUAL_MODULE_ID } from '../virtual'

export function createScanPlugin(options: PandaViteOptions, state: PluginState): Plugin {
  /** Track whether codegen has been run (only needed once across environments) */
  let codegenDone = false

  return {
    name: '@pandacss/vite:scan',
    enforce: 'pre',

    configResolved(config) {
      state.config = config
      state.viteUsesLightningCss = config.css?.transformer === 'lightningcss'
    },

    async configureServer(server) {
      state.server = server

      // Initialize Root for the server environment
      const root = new Root(options)
      await root.init()
      state.roots.set('client', root)

      // Run codegen
      if (options.codegen !== false && !codegenDone) {
        await root.runCodegen()
        codegenDone = true
      }

      // Watch config dependencies
      for (const dep of root.configDeps) {
        server.watcher.add(dep)
      }

      server.watcher.on('change', async (file) => {
        // Check against any root's config deps
        const anyRoot = getRoot(state)
        if (!anyRoot?.isConfigDep(file)) return

        logger.info('vite', 'Config dependency changed, reloading...')

        // Reload ALL roots on config change
        for (const r of state.roots.values()) {
          await r.reload()
        }

        // Invalidate virtual CSS module
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
        }

        server.hot.send({ type: 'full-reload' })
      })
    },

    async buildStart() {
      // Detect environment name: Vite 6+ exposes this.environment, Vite 5 does not
      const envName = (this as any).environment?.name ?? (state.config?.build?.ssr ? 'ssr' : 'client')

      // Skip if this environment already has a Root (e.g. configureServer already set it up)
      if (state.roots.has(envName)) return

      const root = new Root(options)
      await root.init()
      state.roots.set(envName, root)

      if (options.codegen !== false && !codegenDone) {
        await root.runCodegen()
        codegenDone = true
      }

      // In build mode, parse all source files upfront so CSS is ready for load()
      if (state.config?.command === 'build') {
        const { results, filesWithCss } = root.ctx.parseFiles()
        // Cache results for the build transform plugin to look up
        filesWithCss.forEach((file, i) => {
          root.parseResults.set(normalizePath(file), results[i])
        })
      }
    },
  }
}
