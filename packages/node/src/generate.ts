import type { Config } from '@css-panda/types'
import { emitAndExtract } from './artifacts'
import { bundleChunks, writeFileChunk } from './chunks'
import { loadConfigAndCreateContext } from './config'
import { watch } from './watch'

export async function generate(config: Config, configPath?: string) {
  const ctx = await loadConfigAndCreateContext({ config, configPath })
  await emitAndExtract(ctx)

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
  }
}
