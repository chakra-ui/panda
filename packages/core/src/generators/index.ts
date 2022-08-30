import { promises as fs } from 'fs'
import { ensureDir, emptyDir } from 'fs-extra'
import { outdent } from 'outdent'
import path from 'path'
import { InternalContext } from '../create-context'
import { generateConditions } from './conditions'
import { generateCss } from './css'
import { generateCssType } from './css-type'
import { generateCx } from './cx'
import { generateDts } from './dts'
import { generateFontFace } from './font-face'
import { generateGlobalStyle } from './global-style'
import { generateJs } from './js'
import { generatePropertyTypes } from './property-types'
import { generateSerializer } from './serializer'
import { generateTransform } from './transform'

export async function generateSystem(ctx: InternalContext, configCode: string) {
  const { dictionary, clean, outdir, hash } = ctx

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
  const fontFace = generateFontFace()
  const globalStyle = generateGlobalStyle()

  const types = await generateCssType()

  await Promise.all([
    // design tokens
    fs.writeFile(path.join(dsPath, 'index.css'), generateCss(ctx)),
    fs.writeFile(path.join(dsPath, 'index.d.ts'), generateDts(dictionary)),
    fs.writeFile(path.join(dsPath, 'index.js'), generateJs(dictionary)),

    // helper types
    fs.writeFile(path.join(typesPath, 'csstype.d.ts'), types.cssType),
    fs.writeFile(path.join(typesPath, 'panda-csstype.d.ts'), types.pandaCssType),
    fs.writeFile(path.join(typesPath, 'property-type.d.ts'), generatePropertyTypes(ctx.utilities)),
    fs.writeFile(path.join(typesPath, 'conditions.d.ts'), generateConditions(ctx)),

    // serializer (css)
    fs.writeFile(path.join(cssPath, 'transform.js'), generateTransform('../config')),
    fs.writeFile(path.join(cssPath, 'css.js'), generateSerializer('./transform', hash)),
    fs.writeFile(path.join(cssPath, 'css.d.ts'), types.css),

    // cx
    fs.writeFile(path.join(cssPath, 'cx.js'), cx.js),
    fs.writeFile(path.join(cssPath, 'cx.d.ts'), cx.dts),

    // font face
    fs.writeFile(path.join(cssPath, 'font-face.js'), fontFace.js),
    fs.writeFile(path.join(cssPath, 'font-face.d.ts'), fontFace.dts),

    // global style
    fs.writeFile(path.join(cssPath, 'global-style.js'), globalStyle.js),
    fs.writeFile(path.join(cssPath, 'global-style.d.ts'), globalStyle.dts),

    // css / index.js
    fs.writeFile(
      path.join(cssPath, 'index.js'),
      outdent`
     export * from './css'
     export * from './cx'
     export * from './font-face'
     export * from './global-style'
    `,
    ),

    // css / index.d.ts
    fs.writeFile(
      path.join(cssPath, 'index.d.ts'),
      outdent`
     export * from './css'
     export * from './cx'
     export * from './font-face'
     export * from './global-style'
    `,
    ),
  ])
}
