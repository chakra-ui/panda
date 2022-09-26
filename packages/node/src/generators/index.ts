import { readFileSync } from 'fs'
import { outdent } from 'outdent'
import type { Output, PandaContext } from '../context'
import { generateConditions } from './conditions'
import { generateCss, generateKeyframes } from './css'
import { generateCssType } from './css-dts'
import { generateCssMap } from './css-map'
import { generateCx } from './cx'
import { generateFontFace } from './font-face'
import { getEntrypoint } from './get-entrypoint'
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
import { lookItUpSync } from 'look-it-up'
import { dirname } from 'path'
import { minifyConfig } from '@css-panda/ast'

function setupHelpers(ctx: PandaContext): Output {
  const sharedMjs = getEntrypoint('@css-panda/shared', { dev: 'shared.mjs' })
  const code = readFileSync(sharedMjs, 'utf-8')
  return {
    dir: ctx.outdir,
    files: [{ file: 'helpers.js', code }],
  }
}

function setupKeyframes(ctx: PandaContext): Output {
  const code = generateKeyframes(ctx.keyframes)
  return {
    dir: ctx.paths.ds,
    files: [{ file: 'keyframes.css', code }],
  }
}

function setupDesignTokens(ctx: PandaContext): Output {
  if (ctx.tokens.isEmpty) {
    return { files: [] }
  }

  return {
    dir: ctx.paths.ds,
    files: [
      { file: 'index.css', code: generateCss(ctx) },
      { file: 'index.d.ts', code: generateDts() },
      { file: 'index.js', code: generateJs(ctx.tokens) },
    ],
  }
}

function setupGlobalStyle(ctx: PandaContext): Output {
  const code = generateGlobalStyle()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'global-style.js', code: code.js },
      { file: 'global-style.d.ts', code: code.dts },
    ],
  }
}

function setupTypes(ctx: PandaContext): Output {
  const code = generateCssType()
  const conditions = generateConditions(ctx)
  return {
    dir: ctx.paths.types,
    files: [
      { file: 'csstype.d.ts', code: code.cssType },
      { file: 'panda-csstype.d.ts', code: code.pandaCssType },
      { file: 'index.d.ts', code: code.publicType },
      { file: 'token.d.ts', code: generateTokenDts(ctx.tokens) },
      { file: 'property-type.d.ts', code: generatePropertyTypes(ctx.utility) },
      { file: 'conditions.d.ts', code: conditions.dts },
    ],
  }
}

function setupCss(ctx: PandaContext): Output {
  const code = generateSerializer(ctx.hash)
  const conditions = generateConditions(ctx)
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'conditions.js', code: conditions.js },
      { file: 'transform.js', code: generateTransform() },
      { file: 'css.js', code: code.js },
      { file: 'css.d.ts', code: code.dts },
    ],
  }
}

function setupCssMap(ctx: PandaContext): Output {
  const code = generateCssMap()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'css-map.js', code: code.js },
      { file: 'css-map.d.ts', code: code.dts },
    ],
  }
}

function setupCx(ctx: PandaContext): Output {
  const code = generateCx()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'cx.js', code: code.js },
      { file: 'cx.d.ts', code: code.dts },
    ],
  }
}

function setupSx(ctx: PandaContext): Output {
  const code = generateSx()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'sx.js', code: code.js },
      { file: 'sx.d.ts', code: code.dts },
    ],
  }
}

function setupFontFace(ctx: PandaContext): Output {
  const code = generateFontFace()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'font-face.js', code: code.js },
      { file: 'font-face.d.ts', code: code.dts },
    ],
  }
}

function setupRecipes(ctx: PandaContext): Output {
  const code = generateRecipes(ctx)
  if (!code) {
    return { files: [] }
  }
  return {
    dir: ctx.paths.recipe,
    files: [
      { file: 'index.js', code: code.js },
      { file: 'index.d.ts', code: code.dts },
    ],
  }
}

function setupPatterns(ctx: PandaContext): Output {
  const files = generatePattern(ctx)
  if (!files) {
    return { files: [] }
  }

  const indexCode = outdent.string(files.map((file) => `export * from './${file.name}'`).join('\n'))

  return {
    dir: ctx.paths.pattern,
    files: [
      ...files.map((file) => ({ file: `${file.name}.js`, code: file.js })),
      ...files.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: 'index.js', code: indexCode },
      { file: 'index.d.ts', code: indexCode },
    ],
  }
}

function setupJsx(ctx: PandaContext): Output {
  if (!ctx.config.jsx) return { files: [] }

  const isValidProp = generateisValidProp(ctx)
  const factory = generateJsxFactory(ctx)

  return {
    dir: ctx.paths.jsx,
    files: [
      { file: 'is-valid-prop.js', code: isValidProp.js },
      { file: 'index.d.ts', code: factory.dts },
      { file: 'index.jsx', code: factory.js },
    ],
  }
}

function setupCssIndex(ctx: PandaContext): Output {
  const code = outdent`
  export * from './css'
  export * from './cx'
  export * from './font-face'
  export * from './global-style'
  export * from './css-map'
  export * from './sx'
 `

  return {
    dir: ctx.paths.css,
    files: [
      { file: 'index.js', code },
      { file: 'index.d.ts', code },
    ],
  }
}

function setupReset(ctx: PandaContext): Output {
  if (!ctx.preflight) return { files: [] }
  const code = generateReset()
  return { files: [{ file: 'reset.css', code }] }
}

function setupGitIgnore(ctx: PandaContext): Output {
  const txt = outdent`
  ## CSS Panda
  ${ctx.outdir}
  `

  const file = lookItUpSync('.gitignore')

  if (!file)
    return {
      dir: ctx.cwd,
      files: [{ file: '.gitignore', code: txt }],
    }

  let content = readFileSync(file, 'utf-8')

  if (!content.includes(ctx.outdir)) {
    content = `
    ${content}
    
    ${txt}
    `
  }

  return {
    dir: dirname(file),
    files: [{ file: '.gitignore', code: content }],
  }
}

function setupMinifiedConfig(ctx: PandaContext): Output {
  return {
    dir: ctx.outdir,
    files: [{ file: 'config.js', code: minifyConfig(ctx.conf.code) }],
  }
}

export function generateSystem(ctx: PandaContext): Output[] {
  return [
    setupHelpers(ctx),
    setupDesignTokens(ctx),
    setupKeyframes(ctx),
    setupTypes(ctx),
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
    setupGitIgnore(ctx),
    setupMinifiedConfig(ctx),
  ]
}
