import { info } from '@css-panda/logger'
import { loadConfigFile } from '@css-panda/read-config'
import { Config, RequiredBy } from '@css-panda/types'
import { ConfigNotFoundError } from '@css-panda/error'
import path from 'path'
import { contentWatcher } from './content-watcher'
import { createContext } from './create-context'
import { createDebug } from './debug'
import { generateSystem } from './generators'
import { getCommonDir } from './get-common-dir'
import { tempWatcher } from './temp-watcher'
import { createWatcher } from './watcher'

process.setMaxListeners(Infinity)

type UserConfig = RequiredBy<Config, 'outdir' | 'cwd' | 'content'>

export async function generator(userConfig: UserConfig) {
  const { outdir, content, cwd, clean } = userConfig

  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))

  const conf = await loadConfigFile({
    root: path.join(fixtureDir, 'src'),
  })

  createDebug('config:file', conf.path)

  if (!conf.config) {
    throw new ConfigNotFoundError({ cwd, configPath: conf.path })
  }

  const ctx = createContext(conf.config)

  await generateSystem(ctx, { outdir, configCode: conf.code, clean })

  info('⚙️ generated system')

  const tmp = await tempWatcher(ctx, { outdir, cwd })
  createDebug('config:tmpfile', tmp.dir)

  const userContent = await contentWatcher(ctx, {
    content,
    cwd,
    outdir,
    tmpdir: tmp.dir,
  })

  if (!conf.dependencies) return

  const commonDir = getCommonDir(conf.dependencies)

  createDebug('config:deps', commonDir)

  const absDependencies = conf.dependencies.map((file) => file.replace(commonDir, ''))
  const configWatcher = createWatcher(absDependencies, {
    cwd: getCommonDir(conf.dependencies),
  })

  async function close() {
    await configWatcher.close()
    await tmp.watcher.close()
    await userContent.watcher.close()
  }

  configWatcher.on('update', async () => {
    await close()
    info('⚙️ Config updated, restarting...')
    await generator(userConfig)
  })
}
