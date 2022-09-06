import type { Dictionary } from '@css-panda/dictionary'
import { logger } from '@css-panda/logger'
import { minifyConfig } from '@css-panda/ast'
import fs, { appendFile, ensureDir, ensureFile } from 'fs-extra'
import { outdent } from 'outdent'
import path from 'path'
import type { Context } from '../create-context'
import { generateConditions } from './conditions'
import { generateCss, generateKeyframes } from './css'
import { generateCssMap } from './css-map'
import { generateCssType } from './css-type'
import { generateCx } from './cx'
import { generateDts } from './js-dts'
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

async function setupKeyframes(ctx: Context) {
  const code = generateKeyframes(ctx)
  if (!code) return
  ensureDir(ctx.paths.ds)
  const filepath = path.join(ctx.paths.ds, 'index.css')
  ensureFile(filepath)
  return appendFile(filepath, code)
}

async function setupDesignTokens(ctx: Context, dict: Dictionary) {
  if (dict.isEmpty) return
  ensureDir(ctx.paths.ds)
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.ds, 'index.css'), generateCss(ctx)),
    fs.writeFile(path.join(ctx.paths.ds, 'index.d.ts'), generateDts()),
    fs.writeFile(path.join(ctx.paths.ds, 'index.js'), generateJs(dict)),
  ])
}

async function setupGlobalStyle(ctx: Context) {
  ensureDir(ctx.paths.css)
  const code = generateGlobalStyle()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'global-style.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'global-style.d.ts'), code.dts),
  ])
}

async function setupTypes(ctx: Context, dict: Dictionary) {
  ensureDir(ctx.paths.types)
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

async function setupCss(ctx: Context) {
  ensureDir(ctx.paths.css)
  const code = generateSerializer(ctx.hash)
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'transform.js'), generateTransform()),
    fs.writeFile(path.join(ctx.paths.css, 'serializer.js'), code.serializer),
    fs.writeFile(path.join(ctx.paths.css, 'css.js'), code.css),
    fs.writeFile(path.join(ctx.paths.css, 'css.d.ts'), code.dts),
  ])
}

async function setupCssMap(ctx: Context) {
  ensureDir(ctx.paths.css)
  const code = generateCssMap()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'css-map.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'css-map.d.ts'), code.dts),
  ])
}

async function setupCx(ctx: Context) {
  ensureDir(ctx.paths.css)
  const code = generateCx()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'cx.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'cx.d.ts'), code.dts),
  ])
}

async function setupSx(ctx: Context) {
  ensureDir(ctx.paths.css)
  const code = generateSx()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'sx.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'sx.d.ts'), code.dts),
  ])
}

async function setupFontFace(ctx: Context) {
  ensureDir(ctx.paths.css)
  const code = generateFontFace()
  return Promise.all([
    fs.writeFile(path.join(ctx.paths.css, 'font-face.js'), code.js),
    fs.writeFile(path.join(ctx.paths.css, 'font-face.d.ts'), code.dts),
  ])
}

async function setupRecipes(ctx: Context) {
  const code = generateRecipes(ctx.config)

  if (!code) return
  ensureDir(ctx.paths.recipe)
  logger.info("Recipes are generated. Don't forget to import them in your project.")

  return Promise.all([
    fs.writeFile(path.join(ctx.paths.recipe, 'index.js'), code.js),
    fs.writeFile(path.join(ctx.paths.recipe, 'index.d.ts'), code.dts),
  ])
}

async function setupPatterns(ctx: Context) {
  const code = generatePattern(ctx.config)

  if (!code) return
  ensureDir(ctx.paths.pattern)
  logger.info("Patterns are generated. Don't forget to import them in your project.")

  return Promise.all([
    fs.writeFile(path.join(ctx.paths.pattern, 'index.js'), code.js),
    fs.writeFile(path.join(ctx.paths.pattern, 'index.d.ts'), code.dts),
  ])
}

async function setupCssIndex(ctx: Context) {
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

export async function generateSystem(ctx: Context, configCode: string) {
  const { dictionary, configPath } = ctx

  ensureDir(ctx.outdir)
  await fs.writeFile(configPath, minifyConfig(configCode, { minify: true }))

  await Promise.all([
    setupDesignTokens(ctx, dictionary),
    setupKeyframes(ctx),
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
