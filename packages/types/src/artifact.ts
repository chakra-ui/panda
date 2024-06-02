import { type Difference } from 'microdiff'

export type CssArtifactType = 'preflight' | 'tokens' | 'static' | 'global' | 'keyframes'

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
  | 'jsx/factory-helper.js'
  | 'jsx/factory.d.ts'
  | 'jsx/factory.js'
  | 'jsx/index.d.ts'
  | 'jsx/index.js'
  | 'jsx/is-valid-prop.d.ts'
  | 'jsx/is-valid-prop.js'
  | 'patterns/index.d.ts'
  | 'patterns/index.js'
  | 'recipes/create-recipe.js'
  | 'recipes/index.d.ts'
  | 'recipes/index.js'
  | 'themes/index.d.ts'
  | 'themes/index.js'
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
  | 'package.json'

export interface GeneratedArtifact<TFileId extends ArtifactFileId = ArtifactFileId> {
  id: TFileId
  path: string[]
  content: string
}

export type ArtifactImports = Partial<Record<ArtifactFileId, string[]>>

export interface DiffConfigResult {
  hasConfigChanged: boolean
  diffs: Difference[]
}
