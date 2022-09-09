import { logger } from '@css-panda/logger'
import type { Config } from '@css-panda/types'
import glob from 'fast-glob'
import { ensureDir } from 'fs-extra'
import { extractContent } from './extract-content'
import { extractTemp } from './extract-tmp'
import { initialize } from './initialize'
import { watch } from './watchers'

export async function generate(options: Config & { configPath?: string } = {}) {
  const ctx = await initialize(options)

  ensureDir(ctx.paths.temp)

  if (ctx.watch) {
    watch(ctx, {
      onConfigChange() {
        return generate({ ...options, clean: false })
      },
      onTmpChange() {
        return extractTemp(ctx)
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

    await extractTemp(ctx)
  }
}
