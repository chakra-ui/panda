import { logger } from '@pandacss/logger'
import type { Config } from '@pandacss/types'
import { emitAndExtract } from './artifacts'
import { bundleChunks, writeFileChunk } from './chunks'
import { loadConfigAndCreateContext } from './config'
import type { PandaContext } from './context'
import { watchMessage } from './messages'
import { watch } from './watch'

async function build(ctx: PandaContext) {
  const msg = await emitAndExtract(ctx)
  logger.info('css:emit', msg)
}

type RefObject<T> = {
  current: T
}

const loadContext = async (config: Config, configPath?: string) => {
  const ctxRef: RefObject<PandaContext | undefined> = { current: undefined }
  const load = async () => {
    const ctx = await loadConfigAndCreateContext({ config, configPath })
    ctxRef.current = ctx
  }
  await load()
  return [ctxRef as RefObject<PandaContext>, load] as const
}

export async function generate(config: Config, configPath?: string) {
  const [ctxRef, loadCtx] = await loadContext(config, configPath)

  const initialCtx = ctxRef.current
  await build(initialCtx)

  if (initialCtx.watch) {
    await watch(initialCtx, {
      onConfigChange: async () => {
        await loadCtx()
        return build(ctxRef.current)
      },
      onContentChange: async (file) => {
        await writeFileChunk(ctxRef.current, file)
        return bundleChunks(ctxRef.current)
      },
    })

    logger.info('ctx:watch', watchMessage())
  }
}
