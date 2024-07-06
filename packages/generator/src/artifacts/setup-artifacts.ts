import type { Context } from '@pandacss/core'
import { ArtifactFile, ArtifactMap, type MergeArtifactMaps } from './artifact-map'
import { cssConditionsJsArtifact, typesConditionsDtsArtifact } from './js/conditions'
import { stringLiteralConditionsJsArtifact } from './js/conditions.string-literal'
import { cssFnDtsArtifact, cssFnJsArtifact } from './js/css-fn'
import { stringLiteralCssFnDtsArtifact, stringLiteralCssFnJsArtifact } from './js/css-fn.string-literal'
import { cvaDtsArtifact, cvaJsArtifact } from './js/cva'
import { cxDtsArtifact, cxJsArtifact } from './js/cx'
import { helpersJsArtifact } from './js/helpers'
import { isValidPropDtsArtifact, isValidPropJsArtifact } from './js/is-valid-prop'
import { jsxHelpersJsArtifact } from './js/jsx-helper'
import { getPatternsArtifacts } from './js/pattern'
import { getRecipesArtifacts, recipesCreateRecipeArtifact } from './js/recipe'
import { svaDtsArtifact, svaJsArtifact } from './js/sva'
import { themesIndexDtsArtifact, themesIndexJsArtifact } from './js/themes'
import { tokenDtsArtifact, tokenJsArtifact } from './js/token'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes } from './jsx'
import {
  typesCompositionArtifact,
  typesCssTypeArtifact,
  typesPartsArtifact,
  typesPatternArtifact,
  typesRecipeArtifact,
  typesSelectorsArtifact,
  typesStaticCssArtifact,
  typesSystemTypesArtifact,
} from './types/generated'
import { typesGlobalArtifact, typesIndexArtifact } from './types/main'
import { typesPropTypesArtifact } from './types/prop-types'
import { typesStylePropsArtifact } from './types/style-props'
import { tokenTypesArtifact } from './types/token-types'

const recipesIndexJsArtifact = new ArtifactFile({
  id: 'recipes/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.recipe,
  dependencies: ['recipes'],
  computed(ctx) {
    return {
      hasRecipes: !ctx.recipes.isEmpty(),
      recipes: ctx.recipes.details.map((recipe) => recipe.dashName),
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.hasRecipes) return

    return ctx.recipes.map((file) => params.file.exportStar(`./${file}`)).join('\n')
  },
})

const recipesIndexDtsArtifact = new ArtifactFile({
  id: 'recipes/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.recipe,
  dependencies: ['recipes'],
  computed(ctx) {
    return {
      hasRecipes: !ctx.recipes.isEmpty(),
      recipes: ctx.recipes.details.map((recipe) => recipe.dashName),
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.hasRecipes) return

    return ctx.recipes.map((file) => params.file.exportTypeStar(`./${file}`)).join('\n')
  },
})

const patternsIndexJsArtifact = new ArtifactFile({
  id: 'patterns/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.pattern,
  dependencies: ['syntax', 'patterns'],
  computed(ctx) {
    return {
      patternNames: ctx.patterns.details.map((pattern) => pattern.dashName),
      hasPatterns: !ctx.patterns.isEmpty(),
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.hasPatterns) return

    return ctx.patternNames.map((file) => params.file.exportStar(`./${file}`)).join('\n')
  },
})

const patternsIndexDtsArtifact = new ArtifactFile({
  id: 'patterns/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.pattern,
  dependencies: ['syntax', 'patterns'],
  computed(ctx) {
    return {
      patternNames: ctx.patterns.details.map((pattern) => pattern.dashName),
      hasPatterns: !ctx.patterns.isEmpty(),
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.hasPatterns) return

    return ctx.patternNames.map((file) => params.file.exportTypeStar(`./${file}`)).join('\n')
  },
})

const jsxIndexJsArtifact = new ArtifactFile({
  id: 'jsx/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['syntax', 'patterns', 'jsxFramework'],
  computed(ctx) {
    return {
      isStyleProp: !ctx.isTemplateLiteralSyntax,
      patternNames: ctx.patterns.details.map((pattern) => pattern.dashName),
      jsx: ctx.jsx,
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.jsx.framework) return

    const { isStyleProp, patternNames } = ctx

    return `
    ${params.file.exportStar('./factory')}
    ${isStyleProp ? params.file.exportStar('./is-valid-prop') : ''}
    ${isStyleProp ? patternNames.map((file) => params.file.exportStar(`./${file}`)).join('\n') : ''}
    `
  },
})

const jsxIndexDtsArtifact = new ArtifactFile({
  id: 'jsx/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['syntax', 'patterns', 'jsxFramework', 'jsxFactory'],
  computed(ctx) {
    return {
      isStyleProp: !ctx.isTemplateLiteralSyntax,
      patternNames: ctx.patterns.details.map((pattern) => pattern.dashName),
      jsx: ctx.jsx,
    }
  },
  code(params) {
    const ctx = params.computed
    if (!ctx.jsx.framework) return

    const { isStyleProp, patternNames } = ctx

    return `
    ${params.file.exportTypeStar('./factory')}
    ${isStyleProp ? params.file.exportTypeStar('./is-valid-prop') : ''}
    ${isStyleProp ? patternNames.map((file) => params.file.exportTypeStar(`./${file}`)).join('\n') : ''}
    ${params.file.exportType([ctx.jsx.typeName, ctx.jsx.componentName].join(', '), '../types/jsx')}
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
      isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax,
    }
  },
  code(params) {
    const ctx = params.computed

    return `
    ${params.file.exportStar('./css')}
    ${params.file.exportStar('./cx')}
    ${ctx.isTemplateLiteralSyntax ? '' : params.file.exportStar('./cva')}
    ${ctx.isTemplateLiteralSyntax ? '' : params.file.exportStar('./sva')}
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
      isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax,
    }
  },
  code(params) {
    const ctx = params.computed
    return `
    ${params.file.exportTypeStar('./css')}
    ${params.file.exportTypeStar('./cx')}
    ${ctx.isTemplateLiteralSyntax ? '' : params.file.exportTypeStar('./cva')}
    ${ctx.isTemplateLiteralSyntax ? '' : params.file.exportTypeStar('./sva')}
    `
  },
})

const getStaticArtifacts = () => {
  return (
    new ArtifactMap()
      // {outdir}/
      .addFile(helpersJsArtifact)
      // {outdir}/css/
      .addFile(cssIndexJsArtifact)
      .addFile(cssIndexDtsArtifact)
      //
      .addFile(cvaJsArtifact)
      .addFile(cvaDtsArtifact)
      //
      .addFile(cxJsArtifact)
      .addFile(cxDtsArtifact)
      //
      .addFile(svaJsArtifact)
      .addFile(svaDtsArtifact)
      // {outdir}/jsx/
      .addFile(jsxIndexJsArtifact)
      .addFile(jsxIndexDtsArtifact)
      //
      .addFile(isValidPropJsArtifact)
      .addFile(isValidPropDtsArtifact)
      //
      .addFile(jsxHelpersJsArtifact)
      // {outdir}/recipes/
      .addFile(recipesIndexJsArtifact)
      .addFile(recipesIndexDtsArtifact)
      .addFile(recipesCreateRecipeArtifact)
      // {outdir}/patterns/
      .addFile(patternsIndexJsArtifact)
      .addFile(patternsIndexDtsArtifact)
      // {outdir}/themes/
      .addFile(themesIndexJsArtifact)
      .addFile(themesIndexDtsArtifact)
      // {outdir}/tokens/
      .addFile(tokenJsArtifact)
      .addFile(tokenDtsArtifact)
      .addFile(tokenTypesArtifact)
      // {outdir}/types/
      .addFile(typesConditionsDtsArtifact)
      .addFile(typesIndexArtifact)
      .addFile(typesGlobalArtifact)
      .addFile(typesPropTypesArtifact)
      .addFile(typesStylePropsArtifact)
      // (generated from JSON files)
      .addFile(typesCssTypeArtifact)
      .addFile(typesStaticCssArtifact)
      .addFile(typesRecipeArtifact)
      .addFile(typesPatternArtifact)
      .addFile(typesPartsArtifact)
      .addFile(typesCompositionArtifact)
      .addFile(typesSelectorsArtifact)
      .addFile(typesSystemTypesArtifact)
  )
}

const getObjectSyntaxArtifacts = () => {
  return (
    new ArtifactMap()
      // {outdir}/css/ [syntax=object-literal]
      .addFile(cssConditionsJsArtifact)
      .addFile(cssFnJsArtifact)
      .addFile(cssFnDtsArtifact)
  )
}

/**
 * @see config.syntax
 * https://panda-css.com/docs/concepts/template-literals
 */
const getStringLiteralArtifacts = () => {
  return (
    new ArtifactMap()
      // {outdir}/css/ [syntax=template-literal]
      .addFile(stringLiteralConditionsJsArtifact)
      .addFile(stringLiteralCssFnJsArtifact)
      .addFile(stringLiteralCssFnDtsArtifact)
  )
}

/**
 * @see config.emitTokensOnly
 * https://panda-css.com/docs/overview/why-panda#token-generator
 */
const getDesignTokensArtifacts = () => {
  return new ArtifactMap().addFile(tokenJsArtifact).addFile(tokenDtsArtifact).addFile(tokenTypesArtifact)
}

type StaticArtifacts = ReturnType<typeof getStaticArtifacts>
type ObjectSyntaxArtifacts = ReturnType<typeof getObjectSyntaxArtifacts>
type StringLiteralArtifacts = ReturnType<typeof getStringLiteralArtifacts>
type JsxFactoryArtifacts = NonNullable<ReturnType<typeof generateJsxFactory>>
type JsxTypesArtifacts = NonNullable<ReturnType<typeof generateJsxTypes>>

type PossibleArtifacts = MergeArtifactMaps<
  StaticArtifacts,
  MergeArtifactMaps<
    MergeArtifactMaps<ObjectSyntaxArtifacts, StringLiteralArtifacts>,
    MergeArtifactMaps<JsxFactoryArtifacts, ArtifactMap<{ [K in JsxTypesArtifacts['id']]: JsxTypesArtifacts }>>
  >
>

/**
 * Adds all necesarry artifacts to the map based on the config
 */
export const getArtifactsMap = (ctx: Context): PossibleArtifacts => {
  if (ctx.config.emitTokensOnly) return getDesignTokensArtifacts() as any

  const staticArtifacts = getStaticArtifacts()

  if (!ctx.recipes.isEmpty()) {
    getRecipesArtifacts(ctx).forEach((artifact) => staticArtifacts.addFile(artifact))
  }
  if (!ctx.patterns.isEmpty()) {
    getPatternsArtifacts(ctx).forEach((artifact) => staticArtifacts.addFile(artifact))

    if (ctx.jsx.framework) {
      generateJsxPatterns(ctx).forEach((artifact) => staticArtifacts.addFile(artifact))
    }
  }

  if (ctx.jsx.framework) {
    const jsxFactoryArtifacts = generateJsxFactory(ctx)
    if (jsxFactoryArtifacts) {
      staticArtifacts.merge(jsxFactoryArtifacts)
    }

    const jsxTypes = generateJsxTypes(ctx)
    if (jsxTypes) {
      staticArtifacts.addFile(jsxTypes)
    }
  }

  if (!ctx.isTemplateLiteralSyntax) {
    return staticArtifacts.merge(getObjectSyntaxArtifacts()) as any
  }

  return staticArtifacts.merge(getStringLiteralArtifacts()) as any
}
