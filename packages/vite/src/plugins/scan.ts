import { logger } from '@pandacss/logger'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { PandaViteOptions } from '../index'
import { Root } from '../root'
import { RESOLVED_VIRTUAL_MODULE_ID } from '../virtual'

export function createScanPlugin(
  options: PandaViteOptions,
  state: { root: Root | null; server: ViteDevServer | null; config: ResolvedConfig | null },
): Plugin {
  return {
    name: '@pandacss/vite:scan',
    enforce: 'pre',

    configResolved(config) {
      state.config = config
    },

    async configureServer(server) {
      state.server = server

      // Initialize Root
      const root = new Root(options)
      await root.init()
      state.root = root

      // Run codegen
      if (options.codegen !== false) {
        await root.runCodegen()
      }

      // Watch config dependencies
      for (const dep of root.configDeps) {
        server.watcher.add(dep)
      }

      server.watcher.on('change', async (file) => {
        if (!root.isConfigDep(file)) return

        logger.info('vite', 'Config dependency changed, reloading...')
        await root.reload()

        // Invalidate virtual CSS module
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
        }

        server.hot.send({ type: 'full-reload' })
      })
    },

    async buildStart() {
      // In build mode, configureServer doesn't run
      if (state.root) return

      const root = new Root(options)
      await root.init()
      state.root = root

      if (options.codegen !== false) {
        await root.runCodegen()
      }

      // In build mode, parse all source files upfront so CSS is ready for load()
      if (state.config?.command === 'build') {
        root.ctx.parseFiles()
      }
    },
  }
}
