import { logger } from '@css-panda/logger'
import type { Config } from '@css-panda/types'
import { ensureDir } from 'fs-extra'
import { recrawl } from 'recrawl'
import { extractContent } from '../extract-content'
import { extractTemp } from '../extract-tmp'
import { watch } from '../watchers'
import { initialize } from './initialize'

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
    const crawl = recrawl({
      only: ctx.include,
      skip: ctx.exclude,
    })

    await crawl(ctx.cwd, (file) => {
      logger.debug({ type: 'file', file })
      extractContent(ctx, file)
    })

    await extractTemp(ctx)
  }
}
