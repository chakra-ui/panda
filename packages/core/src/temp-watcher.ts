import { debug } from '@css-panda/logger'
import fs from 'fs-extra'
import path from 'path'
import { InternalContext } from './create-context'
import { createWatcher } from './watcher'

/* -----------------------------------------------------------------------------
 * Temp file watcher
 * -----------------------------------------------------------------------------*/

export async function tempWatcher(ctx: InternalContext, { outdir, cwd }: { outdir: string; cwd: string }) {
  const tempPathDir = path.join(outdir, '.temp')
  fs.ensureDirSync(tempPathDir)

  const tempWatcher = createWatcher([`${tempPathDir}/*.css`], { cwd })

  const cssPath = path.join(cwd, outdir, 'styles.css')

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

  return { dir: tempPathDir, watcher: tempWatcher }
}

export function getTempFile(file: string) {
  return file.replaceAll(path.sep, '__').replace(path.extname(file), '.css')
}
