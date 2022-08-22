import { Stylesheet } from '@css-panda/atomic'
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
   * Temp file watcher
   * -----------------------------------------------------------------------------*/

  const tempPathDir = path.join(outdir, '.temp')
  fs.ensureDirSync(tempPathDir)
  const tempWatcher = createWatcher([`${tempPathDir}/*.css`], { cwd })

  const cssPath = path.join(cwd, outdir, 'styles.css')

  function getTempFile(file: string) {
    return file.replaceAll(path.sep, '__').replace(path.extname(file), '.css')
  }

  tempWatcher.on('all', async (_event, file) => {
    debug('🔎 Temp file changed', file)

    ctx.stylesheet.reset()
    ctx.stylesheet.addImports(['./design-tokens/index.css'])

    const files = fs.readdirSync(tempPathDir)

    await Promise.all(
      files.map(async (file) => {
        const css = await fs.readFile(path.join(tempPathDir, file), 'utf8')
        ctx.stylesheet.append(css)
      }),
    )

    const css = ctx.stylesheet.toCss()
    fs.writeFileSync(cssPath, css)
  })

  /* -----------------------------------------------------------------------------
   * Main content watcher
   * -----------------------------------------------------------------------------*/

  const watcher = createWatcher(content, {
    cwd,
    ignore: ['node_modules', '.git', '__tests__', outdir],
  })

  function extract(file: string) {
    const sheet = new Stylesheet(ctx.context())
    const collector = createCollector()

    transformFileSync(file, {
      file: 'jsx',
      plugins: createPlugins(collector, '../__generated__/css'),
    })

    collector.css.forEach((result) => {
      sheet.process(result)
    })

    if (collector.isEmpty()) return

    const filepath = getTempFile(file)
    const tempPath = path.join(tempPathDir, filepath)

    debug('📝 Writing temp file', tempPath)

    fs.writeFileSync(tempPath, sheet.toCss())
    sheet.reset()
  }

  watcher.on('update', (file) => {
    debug(`📝 File changed ====> ${file}`)
    extract(file)
  })

  watcher.on('create', (file) => {
    debug(`📝 File detected ====> ${file}`)
    extract(file)
  })

  watcher.on('delete', (file) => {
    debug(`📝 File deleted ====> ${file}`)
    fs.unlinkSync(path.join(tempPathDir, getTempFile(file)))
  })
}
