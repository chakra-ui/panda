import type { Config } from '@pandacss/types'
import { loadConfigAndCreateContext } from './config'
import type { PandaContext } from './create-context'

type RefObject<T> = { current: T }

export const loadContext = async (config: Config, configPath?: string) => {
  const ctxRef: RefObject<PandaContext | undefined> = { current: undefined }
  const load = async () => {
    const ctx = await loadConfigAndCreateContext({ config, configPath })
    ctxRef.current = ctx
  }
  await load()
  return [ctxRef as RefObject<PandaContext>, load] as const
}
