import { readFileSync } from 'fs'
import outdent from 'outdent'
import type { Output, PandaContext } from '../context'
import { generateConditions } from './conditions'
import { generateCssFn } from './css-fn'
import { generateCvaFn } from './cva'
import { generateCx } from './cx'
import { getEntrypoint } from './get-entrypoint'
import { generateisValidProp } from './is-valid-prop'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes, generateLayoutGrid } from './jsx'
import { generatePattern } from './pattern'
import { generatePackageJSON } from './pkg-json'
import { generatePropTypes } from './prop-types'
import { generateRecipes } from './recipe'
import { generateReset } from './reset'
import { generateKeyframes, generateTokenCss } from './token-css'
import { generateTokenDts } from './token-dts'
import { generateTokenJs } from './token-js'
import { generateCssType } from './types'

function setupHelpers(ctx: PandaContext): Output {
  const sharedMjs = getEntrypoint('@pandacss/shared', { dev: 'shared.mjs' })
  const code = readFileSync(sharedMjs, 'utf-8')
  return {
    files: [{ file: ctx.getExt('helpers'), code }],
  }
}

function setupKeyframes(ctx: PandaContext): Output {
  const code = generateKeyframes(ctx.theme.keyframes)
  return {
    dir: ctx.paths.token,
    files: [{ file: 'keyframes.css', code }],
  }
}

function setupDesignTokens(ctx: PandaContext): Output {
  if (ctx.tokens.isEmpty) return

  const code = generateTokenJs(ctx.tokens)
  const css = generateTokenCss(ctx)

  return {
    dir: ctx.paths.token,
    files: [
      { file: 'index.css', code: css },
      { file: 'index.d.ts', code: code.dts },
      { file: ctx.getExt('index'), code: code.js },
    ],
  }
}

function setupTypes(ctx: PandaContext): Output {
  const types = generateCssType(ctx)
  const conditions = generateConditions(ctx)
  const jsx = generateJsxTypes(ctx)

  return {
    dir: ctx.paths.types,
    files: [
      jsx ? { file: 'jsx.d.ts', code: jsx.jsxType } : null,
      { file: 'csstype.d.ts', code: types.css },
      { file: 'system-types.d.ts', code: types.system },
      { file: 'selectors.d.ts', code: types.selectors },
      { file: 'composition.d.ts', code: types.composition },
      { file: 'global.d.ts', code: types.global },
      { file: 'recipe.d.ts', code: types.recipe },
      { file: 'index.d.ts', code: types.exported },
      { file: 'token.d.ts', code: generateTokenDts(ctx.tokens) },
      { file: 'prop-type.d.ts', code: generatePropTypes(ctx.utility) },
      { file: 'style-props.d.ts', code: types.styleProps },
      { file: 'conditions.d.ts', code: conditions.dts },
    ].filter(Boolean),
  } as Output
}

function setupCss(ctx: PandaContext): Output {
  const code = generateCssFn(ctx)
  const conditions = generateConditions(ctx)
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.getExt('conditions'), code: conditions.js },
      { file: ctx.getExt('css'), code: code.js },
      { file: 'css.d.ts', code: code.dts },
    ],
  }
}

function setupCva(ctx: PandaContext): Output {
  const code = generateCvaFn(ctx)
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.getExt('cva'), code: code.js },
      { file: 'cva.d.ts', code: code.dts },
    ],
  }
}

function setupCx(ctx: PandaContext): Output {
  const code = generateCx()
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.getExt('cx'), code: code.js },
      { file: 'cx.d.ts', code: code.dts },
    ],
  }
}

function setupRecipes(ctx: PandaContext): Output {
  const code = generateRecipes(ctx)
  if (!code) return
  return {
    dir: ctx.paths.recipe,
    files: [
      { file: ctx.getExt('index'), code: code.js },
      { file: 'index.d.ts', code: code.dts },
    ],
  }
}

function setupPatterns(ctx: PandaContext): Output {
  const files = generatePattern(ctx)
  if (!files) return

  const index = {
    js: outdent.string(files.map((file) => ctx.getExport(`./${file.name}`)).join('\n')),
    dts: outdent.string(files.map((file) => `export { ${file.name} } from './${file.name}'`).join('\n')),
  }

  return {
    dir: ctx.paths.pattern,
    files: [
      ...files.map((file) => ({ file: ctx.getExt(file.name), code: file.js })),
      ...files.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: ctx.getExt('index'), code: index.js },
      { file: 'index.d.ts', code: index.dts },
    ],
  }
}

function setupJsx(ctx: PandaContext): Output {
  if (!ctx.jsxFramework) return

  const isValidProp = generateisValidProp(ctx)
  const types = generateJsxTypes(ctx)!
  const factory = generateJsxFactory(ctx)
  const patterns = generateJsxPatterns(ctx)
  const layoutGrid = generateLayoutGrid(ctx)

  const index = {
    js: outdent`
  ${ctx.getExport('./factory')}
  ${ctx.getExport('./layout-grid')}
  ${outdent.string(patterns.map((file) => ctx.getExport(`./${file.name}`)).join('\n'))}
  `,
    dts: outdent`
  export * from './factory'
  export * from './layout-grid'
  ${outdent.string(patterns.map((file) => `export * from './${file.name}'`).join('\n'))}
  export type { ${ctx.jsxFactoryDetails.typeName} } from '../types/jsx'
    `,
  }

  return {
    dir: ctx.paths.jsx,
    files: [
      ...patterns.map((file) => ({ file: `${file.name}.mjs`, code: file.js })),
      ...patterns.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: 'layout-grid.mjs', code: layoutGrid.js },
      { file: 'layout-grid.d.ts', code: layoutGrid.dts },
      { file: ctx.getExt('is-valid-prop'), code: isValidProp.js },
      { file: 'factory.d.ts', code: types.jsxFactory },
      { file: 'factory.mjs', code: factory.js },
      { file: 'index.d.ts', code: index.dts },
      { file: 'index.mjs', code: index.js },
    ],
  }
}

function setupCssIndex(ctx: PandaContext): Output {
  const index = {
    js: outdent`
  ${ctx.getExport('./css')}
  ${ctx.getExport('./cx')}
  ${ctx.getExport('./cva')}
 `,
    dts: outdent`
  export * from './css'
  export * from './cx'
  export * from './cva'
  `,
  }

  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.getExt('index'), code: index.js },
      { file: 'index.d.ts', code: index.dts },
    ],
  }
}

function setupReset(ctx: PandaContext): Output {
  if (!ctx.preflight) return
  const code = generateReset()
  return { files: [{ file: 'reset.css', code }] }
}

function setupPackageJson(ctx: PandaContext): Output {
  if (!ctx.emitPackage) return
  return {
    files: [{ file: 'package.json', code: generatePackageJSON(ctx) }],
  }
}

export function generateSystem(ctx: PandaContext): Output[] {
  return [
    setupHelpers(ctx),
    setupDesignTokens(ctx),
    setupKeyframes(ctx),
    setupTypes(ctx),
    setupCva(ctx),
    setupCx(ctx),
    setupCss(ctx),
    setupRecipes(ctx),
    setupPatterns(ctx),
    setupCssIndex(ctx),
    setupJsx(ctx),
    setupReset(ctx),
    setupPackageJson(ctx),
  ].filter(Boolean)
}
