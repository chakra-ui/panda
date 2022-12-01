import { colors, logger } from '@pandacss/logger'
import { preview } from 'vite'
import type { BuildOpts } from './vite-build.js'
import { pandaPlugin } from './vite-plugin.js'

export const vitePreview = async ({ outDir }: BuildOpts) => {
  const previewPort = 51000
  try {
    const previewServer = await preview({
      mode: 'production',
      build: {
        outDir,
        emptyOutDir: true,
      },
      preview: {
        port: previewPort,
        open: true,
      },
      plugins: [pandaPlugin()],
    })
    const serverUrl = `${previewServer.config.preview.https ? 'https' : 'http'}://${
      previewServer.config.preview.host || 'localhost'
    }:${previewPort}`

    const serverLink = `${colors.reset(colors.green(serverUrl))} `
    logger.log(colors.dim(`  ${colors.green('➜')}  ${colors.reset(colors.bold('Previewed at'))}: ${serverLink}`))
  } catch (e) {
    console.log(e)
    return false
  }
  return true
}
