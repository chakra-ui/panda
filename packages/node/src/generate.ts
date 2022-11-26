import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { emitAndExtract } from './artifacts'
import { bundleChunks, writeFileChunk } from './chunks'
import { loadConfigAndCreateContext } from './config'
import { buildCompleteMessage, watchMessage } from './messages'
import { watch } from './watch'

export async function generate(config: Config, configPath?: string) {
  const ctx = await loadConfigAndCreateContext({ config, configPath })
  await emitAndExtract(ctx)
  logger.info(buildCompleteMessage(ctx))

  if (ctx.watch) {
    process.stdin.on('end', () => process.exit())

    await watch(ctx, {
      onConfigChange: () => {
        return generate(config, configPath)
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
