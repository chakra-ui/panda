import type { TokenMap } from '@css-panda/tokens'
import { ensureDir, readFile, writeFile } from 'fs-extra'
import { outdent } from 'outdent'
import { join } from 'path'
import type { Context } from '../create-context'
import { generateConditions } from './conditions'
import { generateCss, generateKeyframes } from './css'
import { generateCssType } from './css-dts'
import { generateCssMap } from './css-map'
import { generateCx } from './cx'
import { generateFontFace } from './font-face'
import { generateGlobalStyle } from './global-style'
import { generateisValidProp } from './is-valid-prop'
import { generateJs } from './js'
import { generateDts } from './js-dts'
import { generateJsxFactory } from './jsx'
import { generatePattern } from './pattern'
import { generatePropertyTypes } from './property-types'
import { generateRecipes } from './recipe'
import { generateReset } from './reset'
import { generateSerializer } from './serializer'
import { generateSx } from './sx'
import { generateTokenDts } from './token-dts'
import { generateTransform } from './transform'
import { getEntrypoint, writeFileWithNote } from './__utils'

async function setupHelpers(ctx: Context) {
  const file = getEntrypoint('@css-panda/shared', { dev: 'shared.mjs' })
  const code = await readFile(file, 'utf-8')
  const filepath = join(ctx.outdir, 'helpers.js')
  return writeFileWithNote(filepath, code)
}

async function setupKeyframes(ctx: Context) {
  const code = generateKeyframes(ctx)
  if (!code) return
  await ensureDir(ctx.paths.ds)
  const filepath = join(ctx.paths.ds, 'keyframes.css')
  return writeFileWithNote(filepath, code)
}

async function setupDesignTokens(ctx: Context, dict: TokenMap) {
  if (dict.isEmpty) return
  await ensureDir(ctx.paths.ds)
  return Promise.all([
    writeFileWithNote(join(ctx.paths.ds, 'index.css'), generateCss(ctx, ctx.cssVar?.root)),
    writeFileWithNote(join(ctx.paths.ds, 'index.d.ts'), generateDts()),
    writeFileWithNote(join(ctx.paths.ds, 'index.js'), generateJs(dict)),
  ])
}

async function setupGlobalStyle(ctx: Context) {
  await ensureDir(ctx.paths.css)
  const code = generateGlobalStyle()
  return Promise.all([
    writeFileWithNote(join(ctx.paths.css, 'global-style.js'), code.js),
    writeFileWithNote(join(ctx.paths.css, 'global-style.d.ts'), code.dts),
  ])
}

async function setupTypes(ctx: Context, dict: TokenMap) {
  await ensureDir(ctx.paths.types)

  const code = await generateCssType()
  const conditions = generateConditions(ctx)

  return Promise.all([
    writeFileWithNote(join(ctx.paths.types, 'csstype.d.ts'), code.cssType),
    writeFileWithNote(join(ctx.paths.types, 'panda-csstype.d.ts'), code.pandaCssType),
    writeFileWithNote(join(ctx.paths.types, 'index.d.ts'), code.publicType),
    writeFileWithNote(join(ctx.paths.types, 'token.d.ts'), generateTokenDts(dict)),
    writeFileWithNote(join(ctx.paths.types, 'property-type.d.ts'), generatePropertyTypes(ctx.utilities)),

    writeFileWithNote(join(ctx.paths.css, 'conditions.js'), conditions.js),
    writeFileWithNote(join(ctx.paths.types, 'conditions.d.ts'), conditions.dts),
  ])
}

async function setupCss(ctx: Context) {
  await ensureDir(ctx.paths.css)
  const code = generateSerializer(ctx.hash)
  return Promise.all([
    writeFileWithNote(join(ctx.paths.css, 'transform.js'), generateTransform()),
    writeFileWithNote(join(ctx.paths.css, 'css.js'), code.js),
    writeFileWithNote(join(ctx.paths.css, 'css.d.ts'), code.dts),
  ])
}

async function setupCssMap(ctx: Context) {
  await ensureDir(ctx.paths.css)
  const code = generateCssMap()
  return Promise.all([
    writeFileWithNote(join(ctx.paths.css, 'css-map.js'), code.js),
    writeFileWithNote(join(ctx.paths.css, 'css-map.d.ts'), code.dts),
  ])
}

async function setupCx(ctx: Context) {
  await ensureDir(ctx.paths.css)
  const code = generateCx()
  return Promise.all([
    writeFileWithNote(join(ctx.paths.css, 'cx.js'), code.js),
    writeFileWithNote(join(ctx.paths.css, 'cx.d.ts'), code.dts),
  ])
}

async function setupSx(ctx: Context) {
  await ensureDir(ctx.paths.css)
  const code = generateSx()
  return Promise.all([
    writeFileWithNote(join(ctx.paths.css, 'sx.js'), code.js),
    writeFileWithNote(join(ctx.paths.css, 'sx.d.ts'), code.dts),
  ])
}

async function setupFontFace(ctx: Context) {
  await ensureDir(ctx.paths.css)
  const code = generateFontFace()
  return Promise.all([
    writeFileWithNote(join(ctx.paths.css, 'font-face.js'), code.js),
    writeFileWithNote(join(ctx.paths.css, 'font-face.d.ts'), code.dts),
  ])
}

async function setupRecipes(ctx: Context) {
  const code = generateRecipes(ctx.config)

  if (!code) return
  await ensureDir(ctx.paths.recipe)

  return Promise.all([
    writeFileWithNote(join(ctx.paths.recipe, 'index.js'), code.js),
    writeFileWithNote(join(ctx.paths.recipe, 'index.d.ts'), code.dts),
  ])
}

async function setupPatterns(ctx: Context) {
  const files = generatePattern(ctx)

  if (!files) return
  await ensureDir(ctx.paths.pattern)

  const indexCode = outdent.string(files.map((file) => `export * from './${file.name}'`).join('\n'))

  return Promise.all([
    ...files.map((file) => writeFileWithNote(join(ctx.paths.pattern, `${file.name}.js`), file.js)),
    ...files.map((file) => writeFileWithNote(join(ctx.paths.pattern, `${file.name}.d.ts`), file.dts)),
    writeFileWithNote(join(ctx.paths.pattern, 'index.js'), indexCode),
    writeFileWithNote(join(ctx.paths.pattern, 'index.d.ts'), indexCode),
  ])
}

async function setupJsx(ctx: Context) {
  if (!ctx.jsx) return
  const isValidProp = await generateisValidProp(ctx)
  const factory = generateJsxFactory(ctx)

  await ensureDir(ctx.paths.jsx)

  return Promise.all([
    writeFileWithNote(join(ctx.paths.jsx, 'is-valid-prop.js'), isValidProp.js),
    writeFileWithNote(join(ctx.paths.jsx, 'index.d.ts'), factory.dts),
    writeFileWithNote(join(ctx.paths.jsx, 'index.jsx'), factory.js),
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
    writeFileWithNote(join(ctx.paths.css, 'index.js'), code),
    writeFileWithNote(join(ctx.paths.css, 'index.d.ts'), code),
  ])
}

async function setupReset(ctx: Context) {
  if (!ctx.preflight) return
  const code = await generateReset()
  await ensureDir(ctx.paths.asset)
  return writeFile(join(ctx.paths.asset, 'reset.css'), code)
}

export async function generateSystem(ctx: Context) {
  const { dictionary } = ctx

  await Promise.all([
    setupHelpers(ctx),
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
    setupJsx(ctx),
    setupReset(ctx),
  ])
}
