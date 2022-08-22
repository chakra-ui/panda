import { debug } from '@css-panda/logger'
import { createCollector, createPlugins, transformFileSync } from '@css-panda/parser'
import { loadConfigFile } from '@css-panda/read-config'
import fs from 'fs-extra'
import path from 'path'
import { createContext } from './create-context'
import { createWatcher } from './create-watcher'
import { generateSystem } from './generators'

export async function generator({ outdir, content, cwd }: { outdir: string; content: string[]; cwd: string }) {
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  const { config, code } = await loadConfigFile({ root: path.join(fixtureDir, 'src') })

  if (!config) {
    throw new Error('💥 No config found')
  }

  const ctx = createContext(config)

  await generateSystem(ctx, { outdir, config: code, clean: true })

  /* -----------------------------------------------------------------------------
   * [codegen] Parse files and extract css
   * -----------------------------------------------------------------------------*/

  const watcher = createWatcher(content, {
    cwd,
    ignore: ['node_modules', '.git', '__tests__', outdir],
  })

  const cssPath = path.join(cwd, outdir, 'styles.css')

  function extract(file: string) {
    const collector = createCollector()

    transformFileSync(file, {
      file: 'jsx',
      plugins: createPlugins(collector, '../__generated__/css'),
    })

    collector.css.forEach((result) => {
      ctx.stylesheet.process(result)
    })

    ctx.stylesheet.addImports(['./design-tokens/index.css'])
    const css = ctx.stylesheet.toCss()
    fs.writeFileSync(cssPath, css)
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
