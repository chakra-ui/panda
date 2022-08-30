import fs from 'fs-extra'
import path from 'path'
import { InternalContext } from '../create-context'
import { createDebug } from '../debug'
import { createWatcher } from './create-watcher'

/* -----------------------------------------------------------------------------
 * Temp file watcher
 * -----------------------------------------------------------------------------*/

export async function tempWatcher(ctx: InternalContext) {
  const { cwd, outdir } = ctx

  const tempPathDir = ctx.tempDir
  fs.ensureDirSync(tempPathDir)

  createDebug('temp:dir', tempPathDir)
  const watcher = createWatcher([`${tempPathDir}/*.css`], { cwd })

  const cssPath = path.join(cwd, outdir, 'styles.css')

  let initial = false

  watcher.on('all', async (event, file) => {
    initial = true
    createDebug(`temp:${event}`, file)

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

  // force re-generate stylesheet on initial run
  if (!initial) {
    createDebug('temp:force', '------------------ initial run, forcing re-generate ---------------------')
    const touchFile = path.join(tempPathDir, '__initial__.css')
    fs.writeFileSync(touchFile, process.hrtime.toString())
    fs.unlinkSync(touchFile)
  }

  return watcher
}

export function getTempFile(file: string) {
  return file.replaceAll(path.sep, '__').replace(path.extname(file), '.css')
}
