import { ConfigNotFoundError } from '@css-panda/error'
import { info } from '@css-panda/logger'
import { loadConfigFile } from '@css-panda/read-config'
import type { UserConfig } from '@css-panda/types'
import fs, { emptyDir } from 'fs-extra'
import { recrawl } from 'recrawl'
import { createContext } from './create-context'
import { createDebug, debug } from './debug'
import { extractContent } from './extract-content'
import { extractTemp } from './extract-tmp'
import { generateSystem } from './generators'
import { watch } from './watchers'

let cleaned = false

export async function generator() {
  debug('starting...')

  const conf = await loadConfigFile<UserConfig>()

  createDebug('config:file', conf)

  if (!conf.config) {
    throw new ConfigNotFoundError({
      cwd: process.cwd(),
      path: conf.path,
    })
  }

  const ctx = createContext(conf)

  createDebug('context', ctx)

  if (ctx.clean && !cleaned) {
    cleaned = true
    await emptyDir(ctx.outdir)
  }

  await generateSystem(ctx, conf.code)

  info('⚙️ generated system')

  fs.ensureDirSync(ctx.temp.dir)

  if (ctx.watch) {
    watch(ctx, {
      onConfigChange() {
        return generator()
      },
      onTmpChange() {
        return extractTemp(ctx)
      },
      onContentChange(file) {
        return extractContent(ctx, file)
      },
    })
  } else {
    const crawl = recrawl({
      only: ctx.include,
      skip: ctx.exclude,
    })

    crawl(ctx.cwd, (file) => {
      createDebug('file:', file)
      extractContent(ctx, file)
    })

    await extractTemp(ctx)
  }
}
