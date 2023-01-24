import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { emitAndExtract } from './artifacts'
import { bundleChunks, writeFileChunk } from './chunks'
import { loadConfigAndCreateContext } from './config'
import { watchMessage } from './messages'
import { watch } from './watch'

async function build(config: Config, configPath?: string) {
  const ctx = await loadConfigAndCreateContext({ config, configPath })
  const msg = await emitAndExtract(ctx)
  logger.info(msg)
  return ctx
}

export async function generate(config: Config, configPath?: string) {
  const ctx = await build(config, configPath)

  if (ctx.watch) {
    await watch(ctx, {
      onConfigChange: () => {
        return build(config, configPath)
      },
      onAssetChange() {
        return bundleChunks(ctx)
      },
      onContentChange: (file) => {
        return writeFileChunk(ctx, file)
      },
    })

    logger.info(watchMessage())
  }
}
