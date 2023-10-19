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
import { generateIsValidProp } from './js/is-valid-prop'
import { generatedJsxHelpers } from './js/jsx-helper'
import { generatePattern } from './js/pattern'
import { generateRecipes } from './js/recipe'
import { generateSvaFn } from './js/sva'
import { generateTokenJs } from './js/token'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes } from './jsx'
import { generatePackageJson } from './pkg-json'
import { getGeneratedTypes } from './types/generated'
import { generateTypesEntry } from './types/main'
import { generatePropTypes } from './types/prop-types'
import { generateStyleProps } from './types/style-props'
import { generateTokenTypes } from './types/token-types'

function setupHelpers(ctx: Context): Artifact {
  const code = generateHelpers(ctx)
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
      { file: ctx.file.extDts('index'), code: code.dts },
      { file: ctx.file.ext('index'), code: code.js },
      { file: ctx.file.extDts('tokens'), code: generateTokenTypes(ctx) },
    ],
  }
}

function setupTypes(ctx: Context): Artifact {
  const gen = getGeneratedTypes(ctx)
  const conditions = generateConditions(ctx)
  const jsx = generateJsxTypes(ctx)
  const entry = generateTypesEntry(ctx)

  return {
    dir: ctx.paths.types,
    files: [
      jsx ? { file: ctx.file.extDts('jsx'), code: jsx.jsxType } : null,
      { file: ctx.file.extDts('csstype'), code: gen.cssType },
      { file: ctx.file.extDts('system-types'), code: gen.system },
      { file: ctx.file.extDts('selectors'), code: gen.selectors },
      { file: ctx.file.extDts('composition'), code: gen.composition },
      { file: ctx.file.extDts('global'), code: entry.global },
      { file: ctx.file.extDts('recipe'), code: gen.recipe },
      { file: ctx.file.extDts('pattern'), code: gen.pattern },
      { file: ctx.file.extDts('parts'), code: gen.parts },
      { file: ctx.file.extDts('index'), code: entry.index },
      { file: ctx.file.extDts('prop-type'), code: generatePropTypes(ctx) },
      { file: ctx.file.extDts('style-props'), code: generateStyleProps(ctx) },
      { file: ctx.file.extDts('conditions'), code: conditions.dts },
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
      { file: ctx.file.extDts('css'), code: code.dts },
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
      { file: ctx.file.extDts('cva'), code: code.dts },
    ],
  }
}

function setupSva(ctx: Context): Artifact {
  if (ctx.isTemplateLiteralSyntax) return

  const code = generateSvaFn(ctx)
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('sva'), code: code.js },
      { file: ctx.file.extDts('sva'), code: code.dts },
    ],
  }
}

function setupCx(ctx: Context): Artifact {
  const code = generateCx()
  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('cx'), code: code.js },
      { file: ctx.file.extDts('cx'), code: code.dts },
    ],
  }
}

function setupRecipes(ctx: Context): Artifact {
  const files = generateRecipes(ctx)
  if (!files) return

  const indexFiles = files.filter((file) => !file.name.includes('create-recipe'))

  const index = {
    js: outdent.string(indexFiles.map((file) => ctx.file.exportStar(`./${file.name}`)).join('\n')),
    dts: outdent.string(indexFiles.map((file) => ctx.file.exportTypeStar(`./${file.name}`)).join('\n')),
  }

  return {
    dir: ctx.paths.recipe,
    files: [
      ...files.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...files.map((file) => ({ file: ctx.file.extDts(file.name), code: file.dts })),
      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
    ],
  }
}

function setupPatterns(ctx: Context): Artifact {
  if (ctx.isTemplateLiteralSyntax) return

  const files = generatePattern(ctx)
  if (!files) return

  const index = {
    js: outdent.string(files.map((file) => ctx.file.exportStar(`./${file.name}`)).join('\n')),
    dts: outdent.string(files.map((file) => ctx.file.exportTypeStar(`./${file.name}`)).join('\n')),
  }

  return {
    dir: ctx.paths.pattern,
    files: [
      ...files.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...files.map((file) => ({ file: ctx.file.extDts(file.name), code: file.dts })),
      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
    ],
  }
}

function setupJsx(ctx: Context): Artifact {
  if (!ctx.jsx.framework) return

  const isValidProp = generateIsValidProp(ctx)
  const types = generateJsxTypes(ctx)!
  const factory = generateJsxFactory(ctx)
  const patterns = generateJsxPatterns(ctx)
  const helpers = generatedJsxHelpers(ctx)

  const index = {
    js: outdent`
  ${ctx.file.exportStar('./factory')}
  ${isValidProp?.js ? ctx.file.exportStar('./is-valid-prop') : ''}
  ${outdent.string(patterns.map((file) => ctx.file.exportStar(`./${file.name}`)).join('\n'))}
  `,
    dts: outdent`
  ${ctx.file.exportTypeStar('./factory')}

  ${isValidProp?.dts ? ctx.file.exportTypeStar('./is-valid-prop') : ''}

  ${outdent.string(patterns.map((file) => ctx.file.exportTypeStar(`./${file.name}`)).join('\n'))}

  ${ctx.file.exportType([ctx.jsx.typeName, ctx.jsx.componentName].join(', '), '../types/jsx')}
    `,
  }

  return {
    dir: ctx.paths.jsx,
    files: [
      ...patterns.map((file) => ({ file: ctx.file.ext(file.name), code: file.js })),
      ...patterns.map((file) => ({ file: ctx.file.extDts(file.name), code: file.dts })),

      { file: ctx.file.ext('is-valid-prop'), code: isValidProp?.js },
      { file: ctx.file.extDts('is-valid-prop'), code: isValidProp?.dts },

      !ctx.isTemplateLiteralSyntax ? { file: ctx.file.ext('factory-helper'), code: helpers.js } : undefined,

      { file: ctx.file.ext('factory'), code: factory?.js },
      { file: ctx.file.extDts('factory'), code: types.jsxFactory },

      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
    ],
  }
}

function setupCssIndex(ctx: Context): Artifact {
  const index = {
    js: outdent`
  ${ctx.file.exportStar('./css')}
  ${ctx.file.exportStar('./cx')}
  ${ctx.isTemplateLiteralSyntax ? '' : ctx.file.exportStar('./cva')}
  ${ctx.isTemplateLiteralSyntax ? '' : ctx.file.exportStar('./sva')}
 `,
    dts: outdent`
  ${ctx.file.exportTypeStar('./css')}
  ${ctx.file.exportTypeStar('./cx')}
  ${ctx.isTemplateLiteralSyntax ? '' : ctx.file.exportTypeStar('./cva')}
  ${ctx.isTemplateLiteralSyntax ? '' : ctx.file.exportTypeStar('./sva')}
  `,
  }

  return {
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
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
    setupSva(ctx),
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
        if (!file) return
        if (ctx.file.isTypeFile(file.file)) {
          file.code = `/* eslint-disable */\n${file.code}`
        }
      })
      return artifact
    })
}
