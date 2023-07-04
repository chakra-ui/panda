import { isObject } from '@pandacss/shared'
import type { Artifact } from '@pandacss/types'
import outdent from 'outdent'
import type { Context } from '../engines'
import { generateGlobalCss } from './css/global-css'
import { generateKeyframeCss } from './css/keyframe-css'
import { generateResetCss } from './css/reset-css'
import { generateStaticCss } from './css/static-css'
import { generateTokenCss } from './css/token-css'
import { generateConditions } from './js/conditions'
import { generateStringLiteralConditions } from './js/conditions.string-literal'
import { generateCssFn } from './js/css-fn'
import { generateStringLiteralCssFn } from './js/css-fn.string-literal'
import { generateCvaFn } from './js/cva'
import { generateCx } from './js/cx'
import { generateHelpers } from './js/helpers'
import { generateisValidProp } from './js/is-valid-prop'
import { generatePattern } from './js/pattern'
import { generateRecipes } from './js/recipe'
import { generateTokenJs } from './js/token'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes } from './jsx'
import { generatePackageJson } from './pkg-json'
import { getGeneratedTypes } from './types/generated'
import { generateTypesEntry } from './types/main'
import { generatePropTypes } from './types/prop-types'
import { generateStyleProps } from './types/style-props'
import { generateTokenTypes } from './types/token-types'

function setupHelpers(ctx: Context): Artifact {
  const code = generateHelpers()
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
      { file: 'tokens.d.ts', code: generateTokenTypes(ctx) },
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
      { file: 'helpers.d.ts', code: entry.helpers },
      { file: 'recipe.d.ts', code: gen.recipe },
      { file: 'pattern.d.ts', code: gen.pattern },
      { file: 'parts.d.ts', code: gen.parts },
      { file: 'index.d.ts', code: entry.index },
      { file: 'prop-type.d.ts', code: generatePropTypes(ctx) },
      { file: 'style-props.d.ts', code: generateStyleProps(ctx) },
      { file: 'conditions.d.ts', code: conditions.dts },
    ].filter(Boolean),
  } as Artifact
}

function setupCss(ctx: Context): Artifact {
  const code = ctx.isTemplateLiteralSyntax ? generateStringLiteralCssFn(ctx) : generateCssFn(ctx)
  const conditions = ctx.isTemplateLiteralSyntax ? generateStringLiteralConditions(ctx) : generateConditions(ctx)
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
  if (ctx.isTemplateLiteralSyntax) return

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
  const files = generateRecipes(ctx)
  if (!files) return

  const indexFiles = files.filter((file) => !file.name.includes('create-recipe'))

  const index = {
    js: outdent.string(indexFiles.map((file) => ctx.file.export(`./${file.name}`)).join('\n')),
    dts: outdent.string(indexFiles.map((file) => `export * from './${file.name}'`).join('\n')),
  }

  return {
    dir: ctx.paths.recipe,
    files: [
      ...files.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...files.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: ctx.file.ext('index'), code: index.js },
      { file: 'index.d.ts', code: index.dts },
    ],
  }
}

function setupPatterns(ctx: Context): Artifact {
  if (ctx.isTemplateLiteralSyntax) return

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

  const index = {
    js: outdent`
  ${ctx.file.export('./factory')}
  ${isValidProp?.js ? ctx.file.export('./is-valid-prop') : ''}
  ${outdent.string(patterns.map((file) => ctx.file.export(`./${file.name}`)).join('\n'))}
  `,
    dts: outdent`
  export * from './factory'
  ${isValidProp?.dts ? `export * from './is-valid-prop'` : ''}
  ${outdent.string(patterns.map((file) => `export * from './${file.name}'`).join('\n'))}
  export type { ${ctx.jsx.typeName} } from '../types/jsx'
    `,
  }

  return {
    dir: ctx.paths.jsx,
    files: [
      ...patterns.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...patterns.map((file) => ({ file: `${file.name}.d.ts`, code: file.dts })),
      { file: ctx.file.ext('is-valid-prop'), code: isValidProp?.js },
      { file: 'is-valid-prop.d.ts', code: isValidProp?.dts },
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
  ${ctx.isTemplateLiteralSyntax ? '' : ctx.file.export('./cva')}
 `,
    dts: outdent`
  export * from './css'
  export * from './cx'
  ${ctx.isTemplateLiteralSyntax ? '' : `export * from './cva'`}
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
  const { preflight } = ctx.config
  if (!preflight) return
  const scope = isObject(preflight) ? preflight.scope : undefined
  const code = generateResetCss(ctx, scope)
  return { files: [{ file: 'reset.css', code }] }
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

export const generateArtifacts = (ctx: Context) => (): Artifact[] => {
  if (ctx.config.emitTokensOnly) {
    return [setupDesignTokens(ctx)]
  }

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
    setupGlobalCss(ctx),
    setupStaticCss(ctx),
    setupResetCss(ctx),
    setupPackageJson(ctx),
  ]
    .filter(Boolean)
    .map((artifact) => {
      const files = artifact?.files ?? []
      files.forEach((file) => {
        if (file.file.endsWith('.d.ts')) {
          file.code = `/* eslint-disable */\n${file.code}`
        }
      })
      return artifact
    })
}
