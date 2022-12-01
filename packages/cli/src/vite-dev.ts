import path from 'path'
import { createServer } from 'vite'
import { pandaPlugin } from './vite-plugin'

export const viteBundler = async () => {
  const mode = 'development'
  const port = 2666
  const hmrPort = 4000
  const previewPath = path.join(__dirname, '../app')

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
    plugins: [pandaPlugin()],
  })

  await server.listen()

  server.printUrls()
}
