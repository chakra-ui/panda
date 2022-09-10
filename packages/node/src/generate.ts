import { logger } from '@css-panda/logger'
import type { Config } from '@css-panda/types'
import glob from 'fast-glob'
import { ensureDir } from 'fs-extra'
import { extractAssets } from './extract-assets'
import { extractContent } from './extract-content'
import { initialize } from './initialize'
import { watch } from './watchers'

export async function generate(options: Config & { configPath?: string } = {}) {
  const ctx = await initialize(options)

  ensureDir(ctx.paths.asset)

  if (ctx.watch) {
    watch(ctx, {
      onConfigChange() {
        return generate({ ...options, clean: false })
      },
      onAssetChange() {
        return extractAssets(ctx)
      },
      onContentChange(file) {
        return extractContent(ctx, file)
      },
    })
  } else {
    const globFiles = glob.sync(ctx.include, {
      cwd: ctx.cwd,
      ignore: ctx.exclude,
    })

    await Promise.all(
      globFiles.map(async (file) => {
        logger.debug({ type: 'file', file })
        return extractContent(ctx, file)
      }),
    )

    await extractAssets(ctx)
  }
}
