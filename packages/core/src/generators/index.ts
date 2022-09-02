import type { Dictionary } from '@css-panda/dictionary'
import fs from 'fs-extra'
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
import { generateSx } from './sx'
import { generateTokenDts } from './token-dts'
import { generateTransform } from './transform'

async function setupPaths(paths: Record<string, string>) {
  return Promise.all(Object.values(paths).map((dir) => fs.ensureDir(dir)))
}

async function setupDesignTokens(ctx: InternalContext, dict: Dictionary) {
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.ds, 'index.css'), generateCss(ctx)),
    fs.writeFile(path.join(ctx.paths.ds, 'index.d.ts'), generateDts()),
    fs.writeFile(path.join(ctx.paths.ds, 'index.js'), generateJs(dict)),
  ])
}

async function setupGlobalStyle(ctx: InternalContext) {
  const code = generateGlobalStyle()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'global-style.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'global-style.d.ts'), code.dts),
  ])
}

async function setupTypes(ctx: InternalContext, dict: Dictionary) {
  const code = await generateCssType()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.types, 'csstype.d.ts'), code.cssType),
    fs.writeFile(path.join(ctx.paths.types, 'panda-csstype.d.ts'), code.pandaCssType),
    fs.writeFile(path.join(ctx.paths.types, 'public.d.ts'), code.publicType),
    fs.writeFile(path.join(ctx.paths.types, 'token.d.ts'), generateTokenDts(dict)),
    fs.writeFile(path.join(ctx.paths.types, 'property-type.d.ts'), generatePropertyTypes(ctx.utilities)),
    fs.writeFile(path.join(ctx.paths.types, 'conditions.d.ts'), generateConditions(ctx)),
  ])
}

async function setupCss(ctx: InternalContext) {
  const code = generateSerializer(ctx.hash)
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'transform.js'), generateTransform()),
    fs.writeFile(path.join(ctx.paths.css, 'serializer.js'), code.serializer),
    fs.writeFile(path.join(ctx.paths.css, 'css.js'), code.css),
    fs.writeFile(path.join(ctx.paths.css, 'css.d.ts'), code.dts),
  ])
}

async function setupCssMap(ctx: InternalContext) {
  const code = generateCssMap()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'css-map.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'css-map.d.ts'), code.dts),
  ])
}

async function setupCx(ctx: InternalContext) {
  const code = generateCx()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'cx.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'cx.d.ts'), code.dts),
  ])
}

async function setupSx(ctx: InternalContext) {
  const code = generateSx()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'sx.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'sx.d.ts'), code.dts),
  ])
}

async function setupFontFace(ctx: InternalContext) {
  const code = generateFontFace()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'font-face.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'font-face.d.ts'), code.dts),
  ])
}

async function setupRecipes(ctx: InternalContext) {
  const code = generateRecipes(ctx.config)
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.recipe, 'index.js'), code.js),
    fs.writeFile(path.join(ctx.paths.recipe, 'index.d.ts'), code.dts),
  ])
}

async function setupPatterns(ctx: InternalContext) {
  const code = generatePattern(ctx.config)
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.pattern, 'index.js'), code.js),
    fs.writeFile(path.join(ctx.paths.pattern, 'index.d.ts'), code.dts),
  ])
}

async function setupCssIndex(ctx: InternalContext) {
  const code = outdent`
  export * from './css'
  export * from './cx'
  export * from './font-face'
  export * from './global-style'
  export * from './css-map'
  export * from './sx'
 `

  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'index.js'), code),
    fs.writeFile(path.join(ctx.paths.css, 'index.d.ts'), code),
  ])
}

export async function generateSystem(ctx: InternalContext, configCode: string) {
  const { dictionary, paths, configPath } = ctx

  await setupPaths(paths)
  await fs.writeFile(configPath, configCode)

  await Promise.all([
    setupDesignTokens(ctx, dictionary),
    setupTypes(ctx, dictionary),
    setupCssMap(ctx),
    setupCx(ctx),
    setupSx(ctx),
    setupCss(ctx),
    setupFontFace(ctx),
    setupGlobalStyle(ctx),
    setupRecipes(ctx),
    setupPatterns(ctx),
    setupCssIndex(ctx),
  ])
}
