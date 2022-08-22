import { info } from '@css-panda/logger'
import { loadConfigFile } from '@css-panda/read-config'
import path from 'path'
import { contentWatcher } from './content-watcher'
import { createContext } from './create-context'
import { createDebug } from './debug'
import { generateSystem } from './generators'
import { getCommonDir } from './get-common-dir'
import { tempWatcher } from './temp-watcher'
import { createWatcher } from './watcher'

process.setMaxListeners(Infinity)

export async function generator(genOpts: { outdir: string; content: string[]; cwd: string }) {
  const { outdir, content, cwd } = genOpts

  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))

  const { config, code, dependencies } = await loadConfigFile({
    root: path.join(fixtureDir, 'src'),
  })

  if (!config) {
    throw new Error('💥 No config found')
  }

  const ctx = createContext(config)

  await generateSystem(ctx, {
    outdir,
    configCode: code,
    clean: true,
  })

  info('⚙️ generated system')

  const tmp = await tempWatcher(ctx, { outdir, cwd })
  const _content = await contentWatcher(ctx, { content, cwd, outdir, tmpdir: tmp.dir })

  if (!dependencies) return

  const commonDir = getCommonDir(dependencies)

  createDebug('config:dependencies', commonDir)

  const _deps = dependencies.map((file) => file.replace(commonDir, ''))
  const configWatcher = createWatcher(_deps, { cwd: getCommonDir(dependencies) })

  async function close() {
    await configWatcher.close()
    await tmp.watcher.close()
    await _content.watcher.close()
  }

  configWatcher.on('update', async () => {
    await close()
    info('⚙️ Config updated, restarting...')
    await generator(genOpts)
  })
}
