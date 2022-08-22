import { debug } from '@css-panda/logger'
import { loadConfigFile } from '@css-panda/read-config'
import path from 'path'
import { contentWatcher } from './content-watcher'
import { createContext } from './create-context'
import { generateSystem } from './generators'
import { tempWatcher } from './temp-watcher'
import { createWatcher } from './watcher'

export async function generator(genOpts: { outdir: string; content: string[]; cwd: string }) {
  const { outdir, content, cwd } = genOpts
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  let { config, code, dependencies } = await loadConfigFile({
    root: path.join(fixtureDir, 'src'),
  })

  if (!config) {
    throw new Error('💥 No config found')
  }

  debug('config', config.prefix)

  const ctx = createContext(config)

  await generateSystem(ctx, { outdir, config: code, clean: true })

  const tmp = await tempWatcher(ctx, { outdir, cwd })
  await contentWatcher(ctx, { content, cwd, outdir, tmpdir: tmp.dir })

  if (!dependencies) return

  const configWatcher = createWatcher(['fixture/src/*.ts'], {
    cwd: '/Users/abrahamaremu/Dev/personal/chakra-ui/panda-css/css-panda/packages',
  })

  configWatcher.on('update', async () => {
    await configWatcher.close()
    await generator(genOpts)
  })
}
