import type { Config } from '@css-panda/types'
import { emitAndExtract } from './artifacts'
import { bundleAssets, writeFileAsset } from './assets'
import { loadConfigAndCreateContext } from './config'
import { watch } from './watch'

export async function generate(config: Config, configPath?: string) {
  const ctx = await loadConfigAndCreateContext({ config, configPath })
  await emitAndExtract(ctx)

  if (ctx.watch) {
    process.stdin.on('end', () => process.exit(0))
    process.stdin.resume()

    await watch(ctx, {
      onConfigChange: () => {
        return generate(config, configPath)
      },
      onAssetChange() {
        return bundleAssets(ctx)
      },
      onContentChange: (file) => {
        return writeFileAsset(ctx, file)
      },
    })
  }
}
