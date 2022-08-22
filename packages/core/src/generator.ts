import { loadConfigFile } from '@css-panda/read-config'
import path from 'path'
import { contentWatcher } from './content-watcher'
import { createContext } from './create-context'
import { generateSystem } from './generators'
import { tempWatcher } from './temp-watcher'

export async function generator({ outdir, content, cwd }: { outdir: string; content: string[]; cwd: string }) {
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  const { config, code } = await loadConfigFile({
    root: path.join(fixtureDir, 'src'),
  })

  if (!config) {
    throw new Error('💥 No config found')
  }

  const ctx = createContext(config)

  await generateSystem(ctx, { outdir, config: code, clean: true })

  const tmp = await tempWatcher(ctx, { outdir, cwd })
  await contentWatcher(ctx, { content, cwd, outdir, tmpdir: tmp.dir })
}
