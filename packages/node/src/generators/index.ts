import { readFileSync } from 'fs'
import outdent from 'outdent'
import type { Output, PandaContext } from '../context'
import { generateConditions } from './conditions'
import { generateCssFn } from './css-fn'
import { generateCssMap } from './css-map'
import { generateCx } from './cx'
import { getEntrypoint } from './get-entrypoint'
import { generateisValidProp } from './is-valid-prop'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes, generateLayoutGrid } from './jsx'
import { generatePattern } from './pattern'
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
    dir: ctx.outdir,
    files: [{ file: 'helpers.mjs', code }],
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
  if (ctx.tokens.isEmpty) {
    return { files: [] }
  }

  const code = generateTokenJs(ctx.tokens)
  const css = generateTokenCss(ctx)

  return {
    dir: ctx.paths.token,
    files: [
      { file: 'index.css', code: css },
      { file: 'index.d.ts', code: code.dts },
      { file: 'index.mjs', code: code.js },
    ],
  }
}

function setupTypes(ctx: PandaContext): Output {
  const code = generateCssType(ctx)
  const conditions = generateConditions(ctx)
  const jsx = generateJsxTypes(ctx)
  return {
    dir: ctx.paths.types,
    files: [
      jsx ? { file: 'jsx.d.ts', code: jsx.jsxType } : null,
      { file: 'csstype.d.ts', code: code.cssType },
      { file: 'system-types.d.ts', code: code.pandaCssType },
      { file: 'index.d.ts', code: code.publicType },
      { file: 'token.d.ts', code: generateTokenDts(ctx.tokens) },
      { file: 'prop-type.d.ts', code: generatePropTypes(ctx.utility) },
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
      { file: 'conditions.mjs', code: conditions.js },
      { file: 'css.mjs', code: code.js },
      { file: 'css.d.ts', code: code.dts },
    ],
  }
}

function setupCssMap(ctx: PandaContext): Output {
  const code = generateCssMap()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'css-map.mjs', code: code.js },
      { file: 'css-map.d.ts', code: code.dts },
    ],
  }
}

function setupCx(ctx: PandaContext): Output {
  const code = generateCx()
  return {
    dir: ctx.paths.css,
    files: [
      { file: 'cx.mjs', code: code.js },
      { file: 'cx.d.ts', code: code.dts },
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
      { file: 'index.mjs', code: code.js },
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
      ...files.map((file) => ({ file: `${file.name}.mjs`, code: file.js })),
      ...files.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: 'index.mjs', code: indexCode },
      { file: 'index.d.ts', code: indexCode },
    ],
  }
}

function setupJsx(ctx: PandaContext): Output {
  if (!ctx.jsxFramework) return { files: [] }

  const isValidProp = generateisValidProp(ctx)
  const types = generateJsxTypes(ctx)!
  const factory = generateJsxFactory(ctx)
  const patterns = generateJsxPatterns(ctx)
  const layoutGrid = generateLayoutGrid(ctx)

  const indexCode = outdent`
  export * from './factory'
  export * from './layout-grid'
  ${outdent.string(patterns.map((file) => `export * from './${file.name}'`).join('\n'))}
`

  return {
    dir: ctx.paths.jsx,
    files: [
      ...patterns.map((file) => ({ file: `${file.name}.jsx`, code: file.js })),
      ...patterns.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: 'layout-grid.jsx', code: layoutGrid.js },
      { file: 'layout-grid.d.ts', code: layoutGrid.dts },
      { file: 'is-valid-prop.mjs', code: isValidProp.js },
      { file: 'factory.d.ts', code: types.jsxFactory },
      { file: 'factory.jsx', code: factory.js },
      {
        file: 'index.d.ts',
        code: outdent`
        ${indexCode}
        export type { ${ctx.jsxFactoryDetails.typeName} } from '../types/jsx'
      `,
      },
      { file: 'index.jsx', code: indexCode },
    ],
  }
}

function setupCssIndex(ctx: PandaContext): Output {
  const code = outdent`
  export * from './css'
  export * from './cx'
  export * from './css-map'
 `

  return {
    dir: ctx.paths.css,
    files: [
      { file: 'index.mjs', code },
      { file: 'index.d.ts', code },
    ],
  }
}

function setupReset(ctx: PandaContext): Output {
  if (!ctx.preflight) return { files: [] }
  const code = generateReset()
  return { files: [{ file: 'reset.css', code }] }
}

export function generateSystem(ctx: PandaContext): Output[] {
  return [
    setupHelpers(ctx),
    setupDesignTokens(ctx),
    setupKeyframes(ctx),
    setupTypes(ctx),
    setupCssMap(ctx),
    setupCx(ctx),
    setupCss(ctx),
    setupRecipes(ctx),
    setupPatterns(ctx),
    setupCssIndex(ctx),
    setupJsx(ctx),
    setupReset(ctx),
  ]
}
