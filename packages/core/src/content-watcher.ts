import { Stylesheet } from '@css-panda/atomic'
import { debug } from '@css-panda/logger'
import { createCollector, createPlugins, transformFileSync } from '@css-panda/parser'
import fs from 'fs-extra'
import path from 'path'
import { InternalContext } from './create-context'
import { createWatcher } from './watcher'
import { getTempFile } from './temp-watcher'

type Options = {
  content: string[]
  cwd: string
  outdir: string
  tmpdir: string
  hash?: boolean
}

export async function contentWatcher(ctx: InternalContext, options: Options) {
  const { content, cwd, outdir, tmpdir, hash } = options

  const watcher = createWatcher(content, {
    cwd,
    ignore: ['node_modules', '.git', '__tests__', outdir],
  })

  function extract(file: string) {
    const sheet = new Stylesheet(ctx.context(), { hash })
    const collector = createCollector()

    transformFileSync(file, {
      file: 'jsx',
      plugins: createPlugins(collector, '../__generated__/css'),
    })

    collector.globalStyle.forEach((result) => {
      sheet.processObject(result.data)
    })

    collector.fontFace.forEach((result) => {
      sheet.processFontFace(result)
    })

    collector.css.forEach((result) => {
      sheet.process(result)
    })

    if (collector.isEmpty()) return

    const filepath = getTempFile(file)
    const tempPath = path.join(tmpdir, filepath)

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
    fs.unlinkSync(path.join(tmpdir, getTempFile(file)))
  })

  return { watcher }
}
