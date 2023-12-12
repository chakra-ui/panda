import type { AffectedArtifacts, Artifact, ArtifactFilters, ArtifactId } from '@pandacss/types'
import outdent from 'outdent'
import type { Context } from '../engines'
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
import { generateCreateRecipe, generateRecipes } from './js/recipe'
import { generateSvaFn } from './js/sva'
import { generateTokenJs } from './js/token'
import { generateJsxFactory, generateJsxPatterns, generateJsxTypes } from './jsx'
import { generatePackageJson } from './pkg-json'
import { getGeneratedSystemTypes, getGeneratedTypes } from './types/generated'
import { generateTypesEntry } from './types/main'
import { generatePropTypes } from './types/prop-types'
import { generateStyleProps } from './types/style-props'
import { generateTokenTypes } from './types/token-types'

function setupHelpers(ctx: Context): Artifact {
  const code = generateHelpers(ctx)
  return {
    id: 'helpers',
    files: [{ file: ctx.file.ext('helpers'), code: code.js }],
  }
}

export function setupDesignTokens(ctx: Context): Artifact {
  if (ctx.tokens.isEmpty) return

  const code = generateTokenJs(ctx)

  return {
    id: 'design-tokens',
    dir: ctx.paths.token,
    files: [
      { file: ctx.file.extDts('index'), code: code.dts },
      { file: ctx.file.ext('index'), code: code.js },
      { file: ctx.file.extDts('tokens'), code: generateTokenTypes(ctx) },
    ],
  }
}
function setupJsxTypes(ctx: Context): Artifact {
  if (!ctx.jsx.framework) return

  const jsx = generateJsxTypes(ctx)!

  return {
    id: 'types-jsx',
    dir: ctx.paths.types,
    files: [{ file: ctx.file.extDts('jsx'), code: jsx.jsxType }],
  }
}

function setupEntryTypes(ctx: Context): Artifact {
  const entry = generateTypesEntry(ctx, Boolean(ctx.jsx.framework))

  return {
    id: 'types-entry',
    dir: ctx.paths.types,
    files: [
      { file: ctx.file.extDts('global'), code: entry.global },
      { file: ctx.file.extDts('index'), code: entry.index },
    ],
  }
}

function setupStyleTypes(ctx: Context): Artifact {
  return {
    id: 'types-styles',
    dir: ctx.paths.types,
    files: [
      { file: ctx.file.extDts('prop-type'), code: generatePropTypes(ctx) },
      { file: ctx.file.extDts('style-props'), code: generateStyleProps(ctx) },
    ],
  }
}

function setupConditionsTypes(ctx: Context): Artifact {
  const conditions = generateConditions(ctx)

  return {
    id: 'types-conditions',
    dir: ctx.paths.types,
    files: [{ file: ctx.file.extDts('conditions'), code: conditions.dts }],
  }
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
  const gen = getGeneratedSystemTypes(ctx)!

  return {
    id: 'types-gen-system',
    dir: ctx.paths.types,
    files: [{ file: ctx.file.extDts('system-types'), code: gen.system }],
  }
}

function setupCss(ctx: Context): Artifact {
  const code = ctx.isTemplateLiteralSyntax ? generateStringLiteralCssFn(ctx) : generateCssFn(ctx)
  const conditions = ctx.isTemplateLiteralSyntax ? generateStringLiteralConditions(ctx) : generateConditions(ctx)
  return {
    id: 'css-fn',
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
    id: 'cva',
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
    id: 'sva',
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
    id: 'cx',
    dir: ctx.paths.css,
    files: [
      { file: ctx.file.ext('cx'), code: code.js },
      { file: ctx.file.extDts('cx'), code: code.dts },
    ],
  }
}

function setupCreateRecipe(ctx: Context): Artifact {
  if (ctx.recipes.isEmpty()) return

  const createRecipe = generateCreateRecipe(ctx)!

  return {
    id: 'create-recipe',
    dir: ctx.paths.recipe,
    files: [
      { file: ctx.file.ext(createRecipe.name), code: createRecipe.js },
      { file: ctx.file.extDts(createRecipe.name), code: createRecipe.dts },
    ],
  }
}

function setupRecipesIndex(ctx: Context): Artifact {
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

function setupRecipes(ctx: Context, filters?: ArtifactFilters): Artifact {
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

function setupPatternsIndex(ctx: Context): Artifact {
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

function setupPatterns(ctx: Context, filters?: ArtifactFilters): Artifact {
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

function setupJsxIsValidProp(ctx: Context): Artifact {
  if (!ctx.jsx.framework || ctx.isTemplateLiteralSyntax) return

  const isValidProp = generateIsValidProp(ctx)

  return {
    id: 'jsx-is-valid-prop',
    dir: ctx.paths.jsx,
    files: [
      { file: ctx.file.ext('is-valid-prop'), code: isValidProp?.js },
      { file: ctx.file.extDts('is-valid-prop'), code: isValidProp?.dts },
    ],
  }
}

function setupJsxFactory(ctx: Context): Artifact {
  if (!ctx.jsx.framework) return

  const types = generateJsxTypes(ctx)!
  const factory = generateJsxFactory(ctx)

  return {
    id: 'jsx-factory',
    dir: ctx.paths.jsx,
    files: [
      { file: ctx.file.ext('factory'), code: factory?.js },
      { file: ctx.file.extDts('factory'), code: types.jsxFactory },
    ],
  }
}

function setupJsxHelpers(ctx: Context): Artifact {
  if (!ctx.jsx.framework) return

  const helpers = generatedJsxHelpers(ctx)

  return {
    id: 'jsx-helpers',
    dir: ctx.paths.jsx,
    files: [{ file: ctx.file.ext('factory-helper'), code: helpers.js }],
  }
}

function setupJsxPatterns(ctx: Context, filters?: ArtifactFilters): Artifact {
  if (!ctx.jsx.framework || ctx.isTemplateLiteralSyntax) return

  const patterns = generateJsxPatterns(ctx, filters)

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

function setupJsxPatternsIndex(ctx: Context): Artifact {
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

function setupPackageJson(ctx: Context): Artifact {
  if (!ctx.config.emitPackage) return
  return {
    id: 'package.json',
    files: [{ file: 'package.json', code: generatePackageJson(ctx) }],
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
  const ids = filters?.ids
  if (!ids) return artifacts

  const affected = filters.affecteds

  return artifacts
    .filter((artifact) => {
      if (!artifact) return false

      return ids.includes(artifact.id)
    })
    .map((artifact) => {
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
  ['helpers', setupHelpers],
  ['design-tokens', setupDesignTokens],
  ['types-jsx', setupJsxTypes],
  ['types-entry', setupEntryTypes],
  ['types-styles', setupStyleTypes],
  ['types-conditions', setupConditionsTypes],
  ['types-gen', setupGeneratedTypes],
  ['types-gen-system', setupGeneratedSystemTypes],
  ['css-fn', setupCss],
  ['cva', setupCva],
  ['sva', setupSva],
  ['cx', setupCx],
  ['create-recipe', setupCreateRecipe],
  ['recipes-index', setupRecipesIndex],
  ['recipes', setupRecipes],
  ['patterns-index', setupPatternsIndex],
  ['patterns', setupPatterns],
  ['jsx-is-valid-prop', setupJsxIsValidProp],
  ['jsx-factory', setupJsxFactory],
  ['jsx-helpers', setupJsxHelpers],
  ['jsx-patterns', setupJsxPatterns],
  ['jsx-patterns-index', setupJsxPatternsIndex],
  ['css-index', setupCssIndex],
  ['package.json', setupPackageJson],
]

const getMatchingArtifacts = (ctx: Context, filters: ArtifactFilters | undefined): Artifact[] => {
  const ids = filters?.ids
  if (!ids) return entries.map(([_artifactId, fn]) => fn(ctx))

  return entries.filter(([artifactId]) => ids.includes(artifactId)).map(([_artifactId, fn]) => fn(ctx, filters))
}

const transformArtifact = (ctx: Context, artifact: Artifact): Artifact => {
  const files = (artifact?.files ?? []).filter(Boolean).map((item) => {
    if (ctx.file.isTypeFile(item.file)) {
      return { ...item, code: `/* eslint-disable */\n${item.code}` }
    }

    return item
  })

  return { ...artifact, files } as Artifact
}

export const setupArtifacts = (ctx: Context, ids?: ArtifactId[]): Artifact[] => {
  const affecteds = getAffectedArtifacts(ids)
  const artifacts = getMatchingArtifacts(ctx, { ids, affecteds })
  const matches = filterArtifactsFiles(artifacts, { ids, affecteds })

  return matches.map((artifact) => transformArtifact(ctx, artifact))
}
