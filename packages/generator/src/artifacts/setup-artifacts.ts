import type { Context } from '@pandacss/core'
import type { AffectedArtifacts, Artifact, ArtifactFilters, ArtifactId } from '@pandacss/types'
import outdent from 'outdent'
import { ArtifactFile, ArtifactMap } from './artifact'
import { cssConditionsJsArtifact, typesConditionsDtsArtifact } from './js/conditions'
import { stringLiteralConditionsJsArtifact } from './js/conditions.string-literal'
import { cssFnDtsArtifact, cssFnJsArtifact } from './js/css-fn'
import { stringLiteralCssFnDtsArtifact, stringLiteralCssFnJsArtifact } from './js/css-fn.string-literal'
import { cvaDtsArtifact, cvaJsArtifact } from './js/cva'
import { cxDtsArtifact, cxJsArtifact } from './js/cx'
import { helpersJsArtifact } from './js/helpers'
import { isValidPropDtsArtifact, isValidPropJsArtifact } from './js/is-valid-prop'
import { jsxHelpersJsArtifact } from './js/jsx-helper'
import { generatePattern } from './js/pattern'
import { createRecipeArtifact, generateRecipes } from './js/recipe'
import { svaDtsArtifact, svaJsArtifact } from './js/sva'
import { themesIndexDtsArtifact, themesIndexJsArtifact } from './js/themes'
import { tokenDtsArtifact, tokenJsArtifact } from './js/token'
import { generateJsxPatterns } from './jsx'
import { packageJsonArtifact } from './pkg-json'
import { getGeneratedSystemTypes, getGeneratedTypes } from './types/generated'
import { typesGlobalArtifact, typesIndexArtifact } from './types/main'
import { propTypesArtifact } from './types/prop-types'
import { stylePropsArtifact } from './types/style-props'
import { tokenTypesArtifact } from './types/token-types'

export function getDesignTokensArtifacts() {
  return new ArtifactMap().addFile(tokenJsArtifact).addFile(tokenDtsArtifact).addFile(tokenTypesArtifact)
}

function setupGeneratedTypes(ctx: Context): Artifact {
  const gen = getGeneratedTypes(ctx)

  return {
    id: 'types-gen',
    dir: ctx.paths.types,
    files: [
      { file: ctx.file.extDts('csstype'), code: gen.cssType },
      { file: ctx.file.extDts('static-css'), code: gen.static },
      { file: ctx.file.extDts('selectors'), code: gen.selectors },
      { file: ctx.file.extDts('composition'), code: gen.composition },
      { file: ctx.file.extDts('recipe'), code: gen.recipe },
      { file: ctx.file.extDts('pattern'), code: gen.pattern },
      { file: ctx.file.extDts('parts'), code: gen.parts },
    ],
  }
}

function setupGeneratedSystemTypes(ctx: Context): Artifact {
  const gen = getGeneratedSystemTypes(ctx)

  return {
    id: 'types-gen-system',
    dir: ctx.paths.types,
    files: [{ file: ctx.file.extDts('system-types'), code: gen.system }],
  }
}

const recipesIndexJsArtifact = new ArtifactFile({
  id: 'recipes/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.recipe,
  dependencies: ['recipes', 'syntax'],
  computed(ctx) {
    return {
      hasRecipes: !ctx.recipes.isEmpty(),
      recipes: ctx.recipes.details.map((recipe) => recipe.dashName),
      exportStar: ctx.file.exportStar,
      exportTypeStar: ctx.file.exportTypeStar,
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.hasRecipes) return

    return ctx.recipes.map((file) => ctx.exportStar(`./${file}`)).join('\n')
  },
})

const recipesIndexDtsArtifact = new ArtifactFile({
  id: 'recipes/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.recipe,
  dependencies: ['recipes', 'syntax'],
  computed(ctx) {
    return {
      hasRecipes: !ctx.recipes.isEmpty(),
      recipes: ctx.recipes.details.map((recipe) => recipe.dashName),
      exportStar: ctx.file.exportStar,
      exportTypeStar: ctx.file.exportTypeStar,
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.hasRecipes) return

    return ctx.recipes.map((file) => ctx.exportTypeStar(`./${file}`)).join('\n')
  },
})

function setupRecipes(ctx: Context, filters?: ArtifactFilters): Artifact | undefined {
  if (ctx.recipes.isEmpty()) return

  const files = generateRecipes(ctx, filters)
  if (!files) return

  return {
    id: 'recipes',
    dir: ctx.paths.recipe,
    files: files.flatMap((file) => [
      { file: ctx.file.ext(file.name), code: file.js },
      { file: ctx.file.extDts(file.name), code: file.dts },
    ]),
  }
}

function setupPatternsIndex(ctx: Context): Artifact | undefined {
  if (ctx.isTemplateLiteralSyntax) return

  const fileNames = ctx.patterns.details.map((pattern) => pattern.dashName)
  const index = {
    js: outdent.string(fileNames.map((file) => ctx.file.exportStar(`./${file}`)).join('\n')),
    dts: outdent.string(fileNames.map((file) => ctx.file.exportTypeStar(`./${file}`)).join('\n')),
  }

  return {
    id: 'patterns-index',
    dir: ctx.paths.pattern,
    files: [
      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
    ],
  }
}

function setupPatterns(ctx: Context, filters?: ArtifactFilters): Artifact | undefined {
  if (ctx.isTemplateLiteralSyntax) return

  const files = generatePattern(ctx, filters)
  if (!files) return

  return {
    id: 'patterns',
    dir: ctx.paths.pattern,
    files: files.flatMap((file) => [
      { file: ctx.file.ext(file.name), code: file.js },
      { file: ctx.file.extDts(file.name), code: file.dts },
    ]),
  }
}

function setupJsxPatterns(ctx: Context, filters?: ArtifactFilters): Artifact | undefined {
  if (!ctx.jsx.framework || ctx.isTemplateLiteralSyntax) return

  const patterns = generateJsxPatterns(ctx, filters)
  if (!patterns) return

  return {
    id: 'jsx-patterns',
    dir: ctx.paths.jsx,
    files: [
      ...patterns.flatMap((file) => [
        { file: ctx.file.ext(file.name), code: file.js },
        { file: ctx.file.extDts(file.name), code: file.dts },
      ]),
    ],
  }
}

const patternsIndexJsArtifact = new ArtifactFile({
  id: 'patterns/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.pattern,
  dependencies: ['patterns', 'syntax', 'jsxFramework'],
  computed(ctx) {
    return {
      isStyleProp: !ctx.isTemplateLiteralSyntax,
      patternNames: ctx.patterns.details.map((pattern) => pattern.dashName),
      exportStar: ctx.file.exportStar,
      exportTypeStar: ctx.file.exportTypeStar,
      jsx: ctx.jsx,
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.jsx.framework) return

    const { isStyleProp, patternNames } = ctx

    return `
    ${ctx.exportStar('./factory')}
    ${isStyleProp ? ctx.exportStar('./is-valid-prop') : ''}
    ${isStyleProp ? outdent.string(patternNames.map((file) => ctx.exportStar(`./${file}`)).join('\n')) : ''}
    `
  },
})

const patternsIndexDtsArtifact = new ArtifactFile({
  id: 'patterns/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.pattern,
  dependencies: ['patterns', 'syntax'],
  computed(ctx) {
    return {
      isStyleProp: !ctx.isTemplateLiteralSyntax,
      patternNames: ctx.patterns.details.map((pattern) => pattern.dashName),
      exportTypeStar: ctx.file.exportTypeStar,
      exportType: ctx.file.exportType,
      jsx: ctx.jsx,
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.jsx.framework) return

    const { isStyleProp, patternNames } = ctx

    return `
    ${ctx.exportTypeStar('./factory')}
    ${isStyleProp ? ctx.exportTypeStar('./is-valid-prop') : ''}
    ${isStyleProp ? outdent.string(patternNames.map((file) => ctx.exportTypeStar(`./${file}`)).join('\n')) : ''}
    ${ctx.exportType([ctx.jsx.typeName, ctx.jsx.componentName].join(', '), '../types/jsx')}
      `
  },
})

const cssIndexJsArtifact = new ArtifactFile({
  id: 'css/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['syntax'],
  computed(ctx) {
    return {
      exportStar: ctx.file.exportStar,
      exportTypeStar: ctx.file.exportTypeStar,
      isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax,
    }
  },
  code(params) {
    const ctx = params.computed
    return `
    ${ctx.exportStar('./css')}
    ${ctx.exportStar('./cx')}
    ${ctx.isTemplateLiteralSyntax ? '' : ctx.exportStar('./cva')}
    ${ctx.isTemplateLiteralSyntax ? '' : ctx.exportStar('./sva')}
   `
  },
})

const cssIndexDtsArtifact = new ArtifactFile({
  id: 'css/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['syntax'],
  computed(ctx) {
    return {
      exportStar: ctx.file.exportStar,
      exportTypeStar: ctx.file.exportTypeStar,
      isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax,
    }
  },
  code(params) {
    const ctx = params.computed
    return `
    ${ctx.exportTypeStar('./css')}
    ${ctx.exportTypeStar('./cx')}
    ${ctx.isTemplateLiteralSyntax ? '' : ctx.exportTypeStar('./cva')}
    ${ctx.isTemplateLiteralSyntax ? '' : ctx.exportTypeStar('./sva')}
    `
  },
})

type ArtifactEntry = [ArtifactId, (ctx: Context, filters?: ArtifactFilters) => Artifact | undefined]
const entries: ArtifactEntry[] = [
  ['types-gen', setupGeneratedTypes],
  ['types-gen-system', setupGeneratedSystemTypes],
  ['recipes', setupRecipes],
  ['patterns', setupPatterns],
  ['jsx-patterns', setupJsxPatterns],
]

export const registerStaticArtifacts = (artifactsMap: ArtifactMap) => {
  return (
    artifactsMap
      // {outdir}/
      .addFile(helpersJsArtifact)
      .addFile(packageJsonArtifact)
      // {outdir}/css/
      .addFile(cssConditionsJsArtifact)
      .addFile(cssFnJsArtifact)
      .addFile(cssFnDtsArtifact)
      //
      .addFile(cssIndexJsArtifact)
      .addFile(cssIndexDtsArtifact)
      //
      .addFile(cvaDtsArtifact)
      .addFile(cvaJsArtifact)
      //
      .addFile(cxJsArtifact)
      .addFile(cxDtsArtifact)
      //
      .addFile(svaJsArtifact)
      .addFile(svaDtsArtifact)
      // {outdir}/css/ [syntax=template-literal]
      .addFile(stringLiteralConditionsJsArtifact)
      .addFile(stringLiteralCssFnJsArtifact)
      .addFile(stringLiteralCssFnDtsArtifact)
      // {outdir}/jsx/
      .addFile(isValidPropJsArtifact)
      .addFile(isValidPropDtsArtifact)
      .addFile(jsxHelpersJsArtifact)
      // {outdir}/recipes/
      .addFile(recipesIndexJsArtifact)
      .addFile(recipesIndexDtsArtifact)
      .addFile(createRecipeArtifact)
      // {outdir}/recipes/
      .addFile(patternsIndexJsArtifact)
      .addFile(patternsIndexDtsArtifact)
      // {outdir}/themes/
      .addFile(themesIndexJsArtifact)
      .addFile(themesIndexDtsArtifact)
      // {outdir}/tokens/
      .addFile(tokenJsArtifact)
      .addFile(tokenDtsArtifact)
      // {outdir}/types/
      .addFile(typesConditionsDtsArtifact)
      .addFile(typesIndexArtifact)
      .addFile(typesGlobalArtifact)
      .addFile(propTypesArtifact)
      .addFile(stylePropsArtifact)
      .addFile(tokenTypesArtifact)
  )
}
