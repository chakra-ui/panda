import { ConfigNotFoundError } from '@css-panda/error'
import { error, info } from '@css-panda/logger'
import { loadConfigFile } from '@css-panda/read-config'
import { UserConfig } from '@css-panda/types'
import { emptyDir } from 'fs-extra'
import { createContext } from './create-context'
import { createDebug, debug } from './debug'
import { generateSystem } from './generators'
import { configWatcher } from './watchers/config'
import { contentWatcher } from './watchers/content'
import { tempWatcher } from './watchers/temp'

process.setMaxListeners(Infinity)

let cleaned = false

export async function generator() {
  debug('starting...')

  const conf = await loadConfigFile<UserConfig>()

  createDebug('config:file', conf)

  if (!conf.config) {
    throw new ConfigNotFoundError({
      cwd: process.cwd(),
      path: conf.path,
    })
  }

  const ctx = createContext(conf.config)

  createDebug('context', ctx)

  if (ctx.clean && !cleaned) {
    cleaned = true
    await emptyDir(ctx.outdir)
  }

  await generateSystem(ctx, conf.code)

  info('⚙️ generated system')

  const _tmpWatcher = await tempWatcher(ctx)
  const _contentWatcher = await contentWatcher(ctx)
  const _configWatcher = await configWatcher(conf)

  async function close() {
    await _configWatcher.close()
    await _tmpWatcher.close()
    await _contentWatcher.close()
  }

  _configWatcher.on('update', async () => {
    await close()
    info('⚙️ Config updated, restarting...')
    await generator()
  })
}

process.on('unhandledRejection', (reason) => {
  error(reason)
})
process.on('uncaughtException', (err) => {
  error(err)
})
