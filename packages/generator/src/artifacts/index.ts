import type { Artifact } from '@pandacss/types'
import outdent from 'outdent'
import { generateKeyframeCss } from './css/keyframe-css'
import { generateLayoutGridCss } from './css/layout-grid-css'
import { generateResetCss } from './css/reset-css'
import { generateTokenCss } from './css/token-css'
import { generateConditions } from './js/conditions'
import { generateCssFn } from './js/css-fn'
import { generateCvaFn } from './js/cva'
import { generateCx } from './js/cx'
import { generateIsValidProp } from './js/helpers'
import { generateisValidProp } from './js/is-valid-prop'
import { generatePattern } from './js/pattern'
import { generateRecipes } from './js/recipe'
import { generateTokenJs } from './js/token'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes, generateLayoutGrid } from './jsx'
import { generatePackageJson } from './pkg-json'
import { getGeneratedTypes } from './types/generated'
import { generateTypesEntry } from './types/main'
import { generatePropTypes } from './types/prop-types'
import { generateStyleProps } from './types/style-props'
import { generateTokenTypes } from './types/token-types'
import type { Context } from '../engines'
import { generateGlobalCss } from './css/global-css'
import { generateStaticCss } from './css/static-css'

function setupHelpers(ctx: Context): Artifact {
  const code = generateIsValidProp()
  return {
    files: [{ file: ctx.file.ext('helpers'), code: code.js }],
  }
}

function setupKeyframes(ctx: Context): Artifact {
  const code = generateKeyframeCss(ctx)
  return {
    dir: ctx.paths.token,
    files: [{ file: 'keyframes.css', code }],
  }
}

function setupDesignTokens(ctx: Context): Artifact {
  if (ctx.tokens.isEmpty) return

  const code = generateTokenJs(ctx)
  const css = generateTokenCss(ctx)

  return {
    dir: ctx.paths.token,
    files: [
      { file: 'index.css', code: css },
      { file: 'index.d.ts', code: code.dts },
      { file: ctx.file.ext('index'), code: code.js },
    ],
  }
}

function setupTypes(ctx: Context): Artifact {
  const gen = getGeneratedTypes()
  const conditions = generateConditions(ctx)
  const jsx = generateJsxTypes(ctx)
  const entry = generateTypesEntry()

  return {
    dir: ctx.paths.types,
    files: [
      jsx ? { file: 'jsx.d.ts', code: jsx.jsxType } : null,
      { file: 'csstype.d.ts', code: gen.cssType },
      { file: 'system-types.d.ts', code: gen.system },
      { file: 'selectors.d.ts', code: gen.selectors },
      { file: 'composition.d.ts', code: gen.composition },
      { file: 'global.d.ts', code: entry.global },
      { file: 'recipe.d.ts', code: gen.recipe },
      { file: 'index.d.ts', code: entry.index },
      { file: 'token.d.ts', code: generateTokenTypes(ctx) },
      { file: 'prop-type.d.ts', code: generatePropTypes(ctx) },
      { file: 'style-props.d.ts', code: generateStyleProps(ctx) },
      { file: 'conditions.d.ts', code: conditions.dts },
    ].filter(Boolean),
  } as Artifact
}

function setupCss(ctx: Context): Artifact {
  const code = generateCssFn(ctx)
  const conditions = generateConditions(ctx)
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('conditions'), code: conditions.js },
      { file: ctx.file.ext('css'), code: code.js },
      { file: 'css.d.ts', code: code.dts },
    ],
  }
}

function setupCva(ctx: Context): Artifact {
  const code = generateCvaFn(ctx)
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('cva'), code: code.js },
      { file: 'cva.d.ts', code: code.dts },
    ],
  }
}

function setupCx(ctx: Context): Artifact {
  const code = generateCx()
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('cx'), code: code.js },
      { file: 'cx.d.ts', code: code.dts },
    ],
  }
}

function setupRecipes(ctx: Context): Artifact {
  const code = generateRecipes(ctx)
  if (!code) return
  return {
    dir: ctx.paths.recipe,
    files: [
      { file: ctx.file.ext('index'), code: code.js },
      { file: 'index.d.ts', code: code.dts },
    ],
  }
}

function setupPatterns(ctx: Context): Artifact {
  const files = generatePattern(ctx)
  if (!files) return

  const index = {
    js: outdent.string(files.map((file) => ctx.file.export(`./${file.name}`)).join('\n')),
    dts: outdent.string(files.map((file) => `export * from './${file.name}'`).join('\n')),
  }

  return {
    dir: ctx.paths.pattern,
    files: [
      ...files.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...files.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: ctx.file.ext('index'), code: index.js },
      { file: 'index.d.ts', code: index.dts },
    ],
  }
}

function setupJsx(ctx: Context): Artifact {
  if (!ctx.jsx.framework) return

  const isValidProp = generateisValidProp(ctx)
  const types = generateJsxTypes(ctx)!
  const factory = generateJsxFactory(ctx)
  const patterns = generateJsxPatterns(ctx)
  const layoutGrid = generateLayoutGrid(ctx)

  const index = {
    js: outdent`
  ${ctx.file.export('./factory')}
  ${ctx.file.export('./layout-grid')}
  ${outdent.string(patterns.map((file) => ctx.file.export(`./${file.name}`)).join('\n'))}
  `,
    dts: outdent`
  export * from './factory'
  export * from './layout-grid'
  ${outdent.string(patterns.map((file) => `export * from './${file.name}'`).join('\n'))}
  export type { ${ctx.jsx.typeName} } from '../types/jsx'
    `,
  }

  return {
    dir: ctx.paths.jsx,
    files: [
      ...patterns.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...patterns.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: ctx.file.ext('layout-grid'), code: layoutGrid?.js },
      { file: 'layout-grid.d.ts', code: layoutGrid?.dts },
      { file: ctx.file.ext('is-valid-prop'), code: isValidProp.js },
      { file: 'factory.d.ts', code: types.jsxFactory },
      { file: ctx.file.ext('factory'), code: factory?.js },
      { file: 'index.d.ts', code: index.dts },
      { file: ctx.file.ext('index'), code: index.js },
    ],
  }
}

function setupCssIndex(ctx: Context): Artifact {
  const index = {
    js: outdent`
  ${ctx.file.export('./css')}
  ${ctx.file.export('./cx')}
  ${ctx.file.export('./cva')}
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
      { file: ctx.file.ext('index'), code: index.js },
      { file: 'index.d.ts', code: index.dts },
    ],
  }
}

function setupResetCss(ctx: Context): Artifact {
  if (!ctx.config.preflight) return
  const code = generateResetCss()
  return { files: [{ file: 'reset.css', code }] }
}

function setupLayoutGridCss(): Artifact {
  const code = generateLayoutGridCss()
  return { files: [{ file: 'layout-grid.css', code }] }
}

function setupGlobalCss(ctx: Context): Artifact {
  const code = generateGlobalCss(ctx)
  return { files: [{ file: 'global.css', code }] }
}

function setupStaticCss(ctx: Context): Artifact {
  const code = generateStaticCss(ctx)
  return { files: [{ file: 'static.css', code }] }
}

function setupPackageJson(ctx: Context): Artifact {
  if (!ctx.config.emitPackage) return
  return {
    files: [{ file: 'package.json', code: generatePackageJson(ctx) }],
  }
}

export const generateArtifacts = (ctx: Context) => (): Artifact[] =>
  [
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
    setupGlobalCss(ctx),
    setupStaticCss(ctx),
    setupResetCss(ctx),
    setupLayoutGridCss(),
    setupPackageJson(ctx),
  ].filter(Boolean)
