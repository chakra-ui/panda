import { debug } from '@css-panda/logger'
import { createCollector, createPlugins, transformSync } from '@css-panda/parser'
import { loadConfigFile } from '@css-panda/read-config'
import fs from 'fs-extra'
import path from 'path'
import { createContext } from './create-context'
import { generateSystemFiles } from './generators'

export async function generator() {
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  const { config, code } = await loadConfigFile({ root: path.join(fixtureDir, 'src') })

  if (!config) {
    debug('💥 No config found')
    throw new Error('💥 No config found')
  }

  const ctx = createContext(config)

  const outdir = '__generated__'
  // const input = ['test.js']

  generateSystemFiles({ ...ctx, outdir, config: code })

  /* -----------------------------------------------------------------------------
   * [codegen] Parse files and extract css
   * -----------------------------------------------------------------------------*/

  const __file = await fs.readFile('test.js', { encoding: 'utf-8' })

  const collected = createCollector()

  transformSync(__file, {
    file: 'js',
    plugins: createPlugins(collected, './__generated__/css'),
  })

  collected.css.forEach((result) => {
    ctx.stylesheet.process(result.data)
  })

  await fs.writeFile('__generated__/styles.css', ctx.stylesheet.toCss())
}

generator()
