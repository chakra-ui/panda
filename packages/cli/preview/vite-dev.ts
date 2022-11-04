import { createServer, PluginOption } from 'vite'
import path from 'path'
import { loadConfigFile } from '@css-panda/config'
import { logger, colors } from '@css-panda/logger'

export const viteBundler = async () => {
  const mode = 'development'
  const port = 2666
  const hmrPort = 4000
  const previewPath = path.join(__dirname, '../preview/app')

  const server = await createServer({
    mode,
    root: previewPath,
    server: {
      open: true,
      port: port,
      hmr: {
        port: hmrPort,
      },
      fs: {
        strict: false,
      },
      middlewareMode: false,
    },
    plugins: [pandaPreviewPlugin()],
  })

  await server.listen()

  server.printUrls()
}

const virtualModuleId = 'virtual:panda'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export const pandaPreviewPlugin = (): PluginOption => {
  return {
    name: 'panda:preview',

    async configureServer(viteServer) {
      const config = await loadConfigFile({ cwd: process.cwd() })
      const file = config.path
      viteServer.watcher.add(file).on('change', async () => {
        const module = viteServer.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) {
          await viteServer.reloadModule(module)
          logger.log(
            colors.dim(
              `  ${colors.green('➜')}  ${colors.reset(colors.blue(colors.bold('[Panda]')))} ${colors.green(
                'config update',
              )} ${colors.grey(config.path)}`,
            ),
          )
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
