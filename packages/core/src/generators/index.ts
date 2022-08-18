import fs from 'fs-extra'
import path from 'path'
import { InternalContext } from '../create-context'
import { generateCss } from './css'
import { generateCx } from './cx'
import { generateDts } from './dts'
import { generateJs } from './js'
import { generateSerializer } from './serializer'
import { generateTransform } from './transform'

type Options = {
  outdir: string
  clean?: boolean
  config?: string
}

export async function generateSystem(ctx: InternalContext, options: Options) {
  const { outdir, clean, config } = options
  const { dictionary, context } = ctx

  const configPath = path.join(outdir, 'config.js')
  await fs.writeFile(configPath, config)

  if (clean) {
    await fs.emptyDir(outdir)
  }

  const cssPath = path.join(outdir, 'css')
  await fs.ensureDir(cssPath)

  const dsPath = path.join(outdir, 'design-tokens')
  await fs.ensureDir(dsPath)

  const cx = generateCx()

  await Promise.all([
    // serializer (css)
    fs.writeFile(path.join(cssPath, 'transform.js'), generateTransform('../config')),
    fs.writeFile(path.join(cssPath, 'index.js'), generateSerializer('./transform')),
    // cx
    fs.writeFile(path.join(cssPath, 'cx.js'), cx.js),
    fs.writeFile(path.join(cssPath, 'cx.d.ts'), cx.dts),
    // design tokens
    fs.writeFile(path.join(dsPath, 'index.css'), generateCss(dictionary, { conditions: context.conditions })),
    fs.writeFile(path.join(dsPath, 'index.d.ts'), generateDts(dictionary)),
    fs.writeFile(path.join(dsPath, 'index.js'), generateJs(dictionary)),
  ])
}
