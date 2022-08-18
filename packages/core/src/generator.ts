import { debug } from '@css-panda/logger'
import { createCollector, createPlugins, transformFileSync } from '@css-panda/parser'
import { loadConfigFile } from '@css-panda/read-config'
import fs from 'fs-extra'
import path from 'path'
import { createContext } from './create-context'
import { generateSystem } from './generators'
import { createWatcher } from './watcher'

export async function generator() {
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  const { config, code } = await loadConfigFile({ root: path.join(fixtureDir, 'src') })

  if (!config) {
    debug('💥 No config found')
    throw new Error('💥 No config found')
  }

  const ctx = createContext(config)

  const outdir = '__generated__'

  generateSystem(ctx, { outdir, config: code })

  /* -----------------------------------------------------------------------------
   * [codegen] Parse files and extract css
   * -----------------------------------------------------------------------------*/

  const watcher = createWatcher(['*.js'], {
    cwd: process.cwd(),
    ignore: ['node_modules', '.git', '__tests__', '__generated__'],
  })

  function extract(file: string) {
    ctx.stylesheet.reset()
    const collected = createCollector()

    transformFileSync(file, {
      file: 'js',
      plugins: createPlugins(collected, './__generated__/css'),
    })

    collected.css.forEach((result) => {
      ctx.stylesheet.process(result)
    })

    fs.writeFileSync('__generated__/styles.css', ctx.stylesheet.toCss())
  }

  watcher.on('update', (file) => {
    debug(`📝 File changed ====> ${file}`)
    extract(file)
  })

  watcher.on('create', (file) => {
    debug(`📝 File detected ====> ${file}`)
    extract(file)
  })
}

generator()
