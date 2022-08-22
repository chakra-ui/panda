import { promises as fs } from 'fs'
import { ensureDir, emptyDir } from 'fs-extra'
import path from 'path'
import { InternalContext } from '../create-context'
import { generateConditions } from './conditions'
import { generateCss } from './css'
import { generateCssType } from './css-type'
import { generateCx } from './cx'
import { generateDts } from './dts'
import { generateJs } from './js'
import { generatePropertyTypes } from './property-types'
import { generateSerializer } from './serializer'
import { generateTransform } from './transform'

type Options = {
  outdir: string
  clean?: boolean
  configCode?: string
}

export async function generateSystem(ctx: InternalContext, options: Options) {
  const { outdir, clean = true, configCode } = options
  const { dictionary, context } = ctx

  const __context = context()

  if (clean) {
    await emptyDir(outdir)
  }

  await ensureDir(outdir)
  const configPath = path.join(outdir, 'config.js')
  await fs.writeFile(configPath, configCode!)

  const cssPath = path.join(outdir, 'css')
  await ensureDir(cssPath)

  const dsPath = path.join(outdir, 'design-tokens')
  await ensureDir(dsPath)

  const typesPath = path.join(outdir, 'types')
  await ensureDir(path.join(typesPath))

  const cx = generateCx()

  const types = await generateCssType()

  await Promise.all([
    // design tokens
    fs.writeFile(
      path.join(dsPath, 'index.css'),
      generateCss(dictionary, {
        conditions: __context.conditions,
        keyframes: ctx.config.keyframes,
      }),
    ),
    fs.writeFile(path.join(dsPath, 'index.d.ts'), generateDts(dictionary)),
    fs.writeFile(path.join(dsPath, 'index.js'), generateJs(dictionary)),

    // helper types
    fs.writeFile(path.join(typesPath, 'csstype.d.ts'), types.cssType),
    fs.writeFile(path.join(typesPath, 'panda-csstype.d.ts'), types.pandaCssType),
    fs.writeFile(path.join(typesPath, 'property-type.d.ts'), generatePropertyTypes(ctx.utilities)),
    fs.writeFile(path.join(typesPath, 'conditions.d.ts'), generateConditions(ctx)),

    // serializer (css)
    fs.writeFile(path.join(cssPath, 'transform.js'), generateTransform('../config')),
    fs.writeFile(path.join(cssPath, 'index.js'), generateSerializer('./transform')),
    fs.writeFile(path.join(cssPath, 'index.d.ts'), types.css),

    // cx
    fs.writeFile(path.join(cssPath, 'cx.js'), cx.js),
    fs.writeFile(path.join(cssPath, 'cx.d.ts'), cx.dts),
  ])
}
