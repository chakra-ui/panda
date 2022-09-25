import type { Config } from '@css-panda/types'
import { emitAndExtract, loadConfigAndCreateContext, onAssetChange, onContentChange } from './context-utils'
import { watch } from './watcher'

export async function generate(config: Config) {
  const ctx = await loadConfigAndCreateContext({ config })
  await emitAndExtract(ctx)

  if (ctx.watch) {
    process.stdin.on('end', () => process.exit(0))
    process.stdin.resume()

    await watch(ctx, {
      onConfigChange: () => {
        return generate(config)
      },
      onAssetChange() {
        return onAssetChange(ctx)
      },
      onContentChange: (file) => {
        return onContentChange(ctx, file)
      },
    })
  }
}
