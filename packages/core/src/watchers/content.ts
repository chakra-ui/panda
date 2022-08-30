import { Stylesheet } from '@css-panda/atomic'
import { createCollector, createPlugins, transformFileSync } from '@css-panda/parser'
import fs from 'fs-extra'
import path from 'path'
import { InternalContext } from '../create-context'
import { createDebug } from '../debug'
import { getTempFile } from './temp'
import { createWatcher } from './create-watcher'

export async function contentWatcher(ctx: InternalContext) {
  const { content, cwd, hash, importMap, ignore } = ctx

  const watcher = createWatcher(content, { cwd, ignore })

  function extract(file: string) {
    const sheet = new Stylesheet(ctx.context(), { hash })
    const collector = createCollector()

    transformFileSync(file, {
      plugins: createPlugins(collector, importMap.css),
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
    const tempPath = path.join(ctx.tempDir, filepath)

    createDebug('temp:write', tempPath)

    fs.writeFileSync(tempPath, sheet.toCss())
    sheet.reset()
  }

  watcher.on('update', (file) => {
    createDebug('file:changed', file)
    extract(file)
  })

  watcher.on('create', (file) => {
    createDebug('file:detected', file)
    extract(file)
  })

  watcher.on('delete', (file) => {
    createDebug('📝 file:deleted', file)
    fs.unlinkSync(path.join(ctx.tempDir, getTempFile(file)))
  })

  return watcher
}
