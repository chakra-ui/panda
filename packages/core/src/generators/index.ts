import { promises as fs } from 'fs'
import { ensureDir } from 'fs-extra'
import { outdent } from 'outdent'
import path from 'path'
import type { InternalContext } from '../create-context'
import { generateConditions } from './conditions'
import { generateCss } from './css'
import { generateCssMap } from './css-map'
import { generateCssType } from './css-type'
import { generateCx } from './cx'
import { generateDts } from './dts'
import { generateFontFace } from './font-face'
import { generateGlobalStyle } from './global-style'
import { generateJs } from './js'
import { generatePattern } from './pattern'
import { generatePropertyTypes } from './property-types'
import { generateRecipes } from './recipe'
import { generateSerializer } from './serializer'
import { generateTokenDts } from './token-dts'
import { generateTransform } from './transform'
import { generateSx } from './sx'

export async function generateSystem(ctx: InternalContext, configCode: string) {
  const { dictionary, outdir, hash } = ctx

  await ensureDir(outdir)
  const configPath = path.join(outdir, 'config.js')
  await fs.writeFile(configPath, configCode!)

  const cssPath = path.join(outdir, 'css')
  await ensureDir(cssPath)

  const dsPath = path.join(outdir, 'design-tokens')
  await ensureDir(dsPath)

  const typesPath = path.join(outdir, 'types')
  await ensureDir(path.join(typesPath))

  const recipePath = path.join(outdir, 'recipes')
  await ensureDir(path.join(recipePath))

  const patternPath = path.join(outdir, 'patterns')
  await ensureDir(patternPath)

  const cx = generateCx()
  const fontFace = generateFontFace()
  const globalStyle = generateGlobalStyle()
  const types = await generateCssType()
  const cssMap = generateCssMap()
  const serialier = generateSerializer(hash)
  const recipes = generateRecipes(ctx.config)
  const patterns = generatePattern(ctx.config)
  const sx = generateSx()

  await Promise.all([
    // design tokens
    fs.writeFile(path.join(dsPath, 'index.css'), generateCss(ctx)),
    fs.writeFile(path.join(dsPath, 'index.d.ts'), generateDts()),
    fs.writeFile(path.join(dsPath, 'index.js'), generateJs(dictionary)),

    // helper types
    fs.writeFile(path.join(typesPath, 'csstype.d.ts'), types.cssType),
    fs.writeFile(path.join(typesPath, 'panda-csstype.d.ts'), types.pandaCssType),
    fs.writeFile(path.join(typesPath, 'public.d.ts'), types.publicType),
    fs.writeFile(path.join(typesPath, 'token.d.ts'), generateTokenDts(dictionary)),
    fs.writeFile(path.join(typesPath, 'property-type.d.ts'), generatePropertyTypes(ctx.utilities)),
    fs.writeFile(path.join(typesPath, 'conditions.d.ts'), generateConditions(ctx)),

    // serializer (css)
    fs.writeFile(path.join(cssPath, 'transform.js'), generateTransform('../config')),
    fs.writeFile(path.join(cssPath, 'serializer.js'), serialier.serializer),
    fs.writeFile(path.join(cssPath, 'css.js'), serialier.css),
    fs.writeFile(path.join(cssPath, 'css.d.ts'), types.css),

    // css map
    fs.writeFile(path.join(cssPath, 'css-map.js'), cssMap.js),
    fs.writeFile(path.join(cssPath, 'css-map.d.ts'), cssMap.dts),

    // cx
    fs.writeFile(path.join(cssPath, 'cx.js'), cx.js),
    fs.writeFile(path.join(cssPath, 'cx.d.ts'), cx.dts),

    // sx
    fs.writeFile(path.join(cssPath, 'sx.js'), sx.js),
    fs.writeFile(path.join(cssPath, 'sx.d.ts'), sx.dts),

    // font face
    fs.writeFile(path.join(cssPath, 'font-face.js'), fontFace.js),
    fs.writeFile(path.join(cssPath, 'font-face.d.ts'), fontFace.dts),

    // global style
    fs.writeFile(path.join(cssPath, 'global-style.js'), globalStyle.js),
    fs.writeFile(path.join(cssPath, 'global-style.d.ts'), globalStyle.dts),

    // recipes
    fs.writeFile(path.join(recipePath, 'index.js'), recipes.js),
    fs.writeFile(path.join(recipePath, 'index.d.ts'), recipes.dts),

    // pattern
    fs.writeFile(path.join(patternPath, 'index.js'), patterns.js),
    fs.writeFile(path.join(patternPath, 'index.d.ts'), patterns.dts),

    // css / index.js
    fs.writeFile(
      path.join(cssPath, 'index.js'),
      outdent`
     export * from './css'
     export * from './cx'
     export * from './font-face'
     export * from './global-style'
     export * from './css-map'
     export * from './sx'
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
     export * from './css-map'
     export * from './sx'
    `,
    ),
  ])
}
