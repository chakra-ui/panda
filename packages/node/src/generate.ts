import { logger } from '@css-panda/logger'
import type { Config } from '@css-panda/types'
import { ensureDir } from 'fs-extra'
import { outdent } from 'outdent'
import { createContext } from './create-context'
import { extractAssets } from './extract-assets'
import { extractContent } from './extract-content'
import { loadConfig } from './load-config'
import { setupSystem } from './setup-system'
import { watch } from './watchers'

export async function generate(options: Config) {
  const config = await loadConfig(process.cwd())

  Object.assign(config.config, options)
  const ctx = createContext(config)

  await setupSystem(config)

  await ensureDir(ctx.paths.asset)

  async function buildOnce() {
    const results: string[] = []
    await Promise.all(
      ctx.sourceFiles.map(async (file) => {
        const css = await extractContent(ctx, file)
        if (css) {
          await ctx.assets.write(file, css)
          results.push(css)
        }
      }),
    )

    if (results.length === 0) {
      logger.warn({
        type: 'file:empty',
        msg: outdent`
        No style object or props were detected in your source files.
        If this is unexpected, double-check the \`include\` options in your Panda config\n
      `,
      })
    }

    const css = await extractAssets(ctx)
    await ctx.outputCss.write(css)
  }

  await buildOnce()

  if (ctx.watch) {
    await watch(ctx, {
      async onConfigChange() {
        await generate(options)
      },
      async onAssetChange() {
        const css = await extractAssets(ctx)
        await ctx.outputCss.write(css)
      },
      async onContentChange(file) {
        logger.info(`File changed: ${file}`)
        const css = await extractContent(ctx, file)
        if (css) {
          await ctx.assets.write(file, css)
        }
      },
    })
  }
}
