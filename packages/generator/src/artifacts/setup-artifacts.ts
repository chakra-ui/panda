import type { Context } from '@pandacss/core'
import type { AffectedArtifacts, Artifact, ArtifactFilters, ArtifactId } from '@pandacss/types'
import outdent from 'outdent'
import { cssConditionsJsArtifact, typesConditionsDtsArtifact } from './js/conditions'
import { stringLiteralConditionsJsArtifact } from './js/conditions.string-literal'
import { cssFnJsArtifact, cssFnDtsArtifact } from './js/css-fn'
import { stringLiteralCssFnJsArtifact, stringLiteralCssFnDtsArtifact } from './js/css-fn.string-literal'
import { cvaDtsArtifact, cvaJsArtifact } from './js/cva'
import { cxJsArtifact, cxDtsArtifact } from './js/cx'
import { helpersJsArtifact } from './js/helpers'
import { isValidPropJsArtifact, isValidPropDtsArtifact } from './js/is-valid-prop'
import { jsxHelpersJsArtifact } from './js/jsx-helper'
import { generatePattern } from './js/pattern'
import { createRecipeArtifact, generateRecipes } from './js/recipe'
import { svaJsArtifact, svaDtsArtifact } from './js/sva'
import { generateThemes, themesIndexJsArtifact, themesIndexDtsArtifact } from './js/themes'
import { tokenDtsArtifact, tokenJsArtifact } from './js/token'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes } from './jsx'
import { packageJsonArtifact } from './pkg-json'
import { getGeneratedSystemTypes, getGeneratedTypes } from './types/generated'
import { typesIndexArtifact, typesGlobalArtifact } from './types/main'
import { propTypesArtifact } from './types/prop-types'
import { stylePropsArtifact } from './types/style-props'
import { tokenTypesArtifact } from './types/token-types'
import { ArtifactMap } from './artifact'

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

function setupRecipesIndex(ctx: Context): Artifact | undefined {
  if (ctx.recipes.isEmpty()) return

  const fileNames = ctx.recipes.details.map((recipe) => recipe.dashName)
  const index = {
    js: outdent.string(fileNames.map((file) => ctx.file.exportStar(`./${file}`)).join('\n')),
    dts: outdent.string(fileNames.map((file) => ctx.file.exportTypeStar(`./${file}`)).join('\n')),
  }

  return {
    id: 'recipes-index',
    dir: ctx.paths.recipe,
    files: [
      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
    ],
  }
}

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

function setupJsxPatternsIndex(ctx: Context): Artifact | undefined {
  if (!ctx.jsx.framework) return

  const isStyleProp = !ctx.isTemplateLiteralSyntax
  const patternNames = ctx.patterns.details.map((pattern) => pattern.dashName)

  const index = {
    js: outdent`
  ${ctx.file.exportStar('./factory')}
  ${isStyleProp ? ctx.file.exportStar('./is-valid-prop') : ''}
  ${isStyleProp ? outdent.string(patternNames.map((file) => ctx.file.exportStar(`./${file}`)).join('\n')) : ''}
  `,
    dts: outdent`
  ${ctx.file.exportTypeStar('./factory')}
  ${isStyleProp ? ctx.file.exportTypeStar('./is-valid-prop') : ''}
  ${isStyleProp ? outdent.string(patternNames.map((file) => ctx.file.exportTypeStar(`./${file}`)).join('\n')) : ''}
  ${ctx.file.exportType([ctx.jsx.typeName, ctx.jsx.componentName].join(', '), '../types/jsx')}
    `,
  }

  return {
    id: 'jsx-patterns-index',
    dir: ctx.paths.jsx,
    files: [
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
    id: 'css-index',
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('index'), code: index.js },
      { file: ctx.file.extDts('index'), code: index.dts },
    ],
  }
}

const getAffectedArtifacts = (ids?: string[]): AffectedArtifacts | undefined => {
  if (!ids) return

  const hasSpecificArtifacts = ids.some(
    (id) => id.startsWith('recipes.') || id.startsWith('slot-recipes.') || id.startsWith('patterns.'),
  )
  if (!hasSpecificArtifacts) return

  return {
    recipes: ids
      .filter((id) => id.startsWith('recipes.') || id.startsWith('slot-recipes.'))
      .map((id) => id.replace('slot-recipes.', '').replace('recipes.', '')),
    patterns: ids.filter((id) => id.startsWith('patterns.')).map((id) => id.replace('patterns.', '')),
  }
}

const filterArtifactsFiles = (artifacts: Artifact[], filters?: ArtifactFilters): Artifact[] => {
  const affected = filters?.affecteds

  return artifacts.map((artifact) => {
    const files = artifact?.files ?? []
    const filtered = files.filter((item) => {
      if (!item) return
      if (!affected) return true

      // only rewrite the affected files (and index files)
      // or all of them if we don't have a list to filter them
      if (affected.recipes && !item.file.includes('index') && artifact?.dir?.includes('recipes')) {
        const isAffected = affected.recipes.some((recipe) => item.file.includes(recipe))
        if (!isAffected) return
      }
      if (
        affected.patterns &&
        !item.file.includes('index') &&
        (artifact?.dir?.includes('patterns') || artifact?.dir?.includes('jsx'))
      ) {
        const isAffected = affected.patterns.some((pattern) => item.file.includes(pattern))
        if (!isAffected) return
      }

      return true
    })
    return { ...artifact, files: filtered } as Artifact
  })
}

type ArtifactEntry = [ArtifactId, (ctx: Context, filters?: ArtifactFilters) => Artifact | undefined]
const entries: ArtifactEntry[] = [
  ['types-gen', setupGeneratedTypes],
  ['types-gen-system', setupGeneratedSystemTypes],
  ['recipes-index', setupRecipesIndex],
  ['recipes', setupRecipes],
  ['patterns-index', setupPatternsIndex],
  ['patterns', setupPatterns],
  ['jsx-patterns', setupJsxPatterns],
  ['jsx-patterns-index', setupJsxPatternsIndex],
  ['css-index', setupCssIndex],
]

export const registerStaticArtifacts = (artifactsMap: ArtifactMap) => {
  // TODO
  // const affecteds = getAffectedArtifacts(ids)
  // const matches = filterArtifactsFiles(artifacts, { ids, affecteds })
  // TODO remove "ids?: ArtifactId[]" from the function signature and everything above
  // instead, compute it based on the ArtifactMap + dependencies
  // search for artifactMatchers

  return artifactsMap
    .addFile(helpersJsArtifact)
    .addFile(tokenJsArtifact)
    .addFile(tokenDtsArtifact)
    .addFile(cssConditionsJsArtifact)
    .addFile(typesConditionsDtsArtifact)
    .addFile(stringLiteralConditionsJsArtifact)
    .addFile(cssFnJsArtifact)
    .addFile(cssFnDtsArtifact)
    .addFile(stringLiteralCssFnJsArtifact)
    .addFile(stringLiteralCssFnDtsArtifact)
    .addFile(cvaDtsArtifact)
    .addFile(cvaJsArtifact)
    .addFile(cxJsArtifact)
    .addFile(cxDtsArtifact)
    .addFile(isValidPropJsArtifact)
    .addFile(isValidPropDtsArtifact)
    .addFile(jsxHelpersJsArtifact)
    .addFile(createRecipeArtifact)
    .addFile(svaJsArtifact)
    .addFile(svaDtsArtifact)
    .addFile(svaJsArtifact)
    .addFile(themesIndexJsArtifact)
    .addFile(themesIndexDtsArtifact)
    .addFile(packageJsonArtifact)
    .addFile(typesIndexArtifact)
    .addFile(typesGlobalArtifact)
    .addFile(propTypesArtifact)
    .addFile(stylePropsArtifact)
    .addFile(tokenTypesArtifact)
}
