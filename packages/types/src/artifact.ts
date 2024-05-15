import { type Difference } from 'microdiff'

export interface ArtifactContent {
  file: string
  code: string | undefined
}

export type ArtifactId =
  | 'helpers'
  | 'keyframes'
  | 'design-tokens'
  | 'types'
  | 'css-fn'
  | 'cva'
  | 'sva'
  | 'cx'
  | 'create-recipe'
  | 'recipes'
  | 'recipes-index'
  | 'patterns'
  | 'patterns-index'
  | 'jsx-is-valid-prop'
  | 'jsx-helpers'
  | 'jsx-factory'
  | 'jsx-patterns'
  | 'jsx-patterns-index'
  | 'css-index'
  | 'themes'
  | 'package.json'
  | 'types-jsx'
  | 'types-entry'
  | 'types-styles'
  | 'types-conditions'
  | 'types-gen'
  | 'types-gen-system'
  | `recipes.${string}`
  | `patterns.${string}`

export type ArtifactFileId =
  | 'css/conditions.js'
  | 'css/css.d.ts'
  | 'css/css.js'
  | 'css/cva.d.ts'
  | 'css/cva.js'
  | 'css/cx.d.ts'
  | 'css/cx.js'
  | 'css/index.d.ts'
  | 'css/index.js'
  | 'css/sva.d.ts'
  | 'css/sva.js'
  | 'jsx/factory.d.ts'
  | 'jsx/factory.js'
  | 'jsx/index.d.ts'
  | 'jsx/index.js'
  | 'patterns/index.d.ts'
  | 'patterns/index.js'
  | 'recipes/create-recipe.js'
  | 'recipes/index.d.ts'
  | 'recipes/index.js'
  | 'tokens/index.d.ts'
  | 'tokens/index.js'
  | 'tokens/tokens.d.ts'
  | 'types/composition.d.ts'
  | 'types/conditions.d.ts'
  | 'types/csstype.d.ts'
  | 'types/global.d.ts'
  | 'types/index.d.ts'
  | 'types/jsx.d.ts'
  | 'types/parts.d.ts'
  | 'types/pattern.d.ts'
  | 'types/prop-type.d.ts'
  | 'types/recipe.d.ts'
  | 'types/selectors.d.ts'
  | 'types/static-css.d.ts'
  | 'types/style-props.d.ts'
  | 'types/system-types.d.ts'
  | 'helpers.js'

export type CssArtifactType = 'preflight' | 'tokens' | 'static' | 'global' | 'keyframes'

export type Artifact = {
  id: ArtifactId
  dir?: string[]
  files: ArtifactContent[]
}

export interface AffectedArtifacts {
  recipes: string[]
  patterns: string[]
}

export interface ArtifactFilters {
  ids?: ArtifactId[]
  affecteds?: AffectedArtifacts
}

export interface DiffConfigResult {
  hasConfigChanged: boolean
  artifacts: Set<ArtifactId>
  diffs: Difference[]
}
