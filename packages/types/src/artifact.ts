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
