import { match } from 'ts-pattern'
import { ArtifactFile } from '../artifact-map'
import composition from '../generated/composition.d.ts.json' assert { type: 'json' }
import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }
import parts from '../generated/parts.d.ts.json' assert { type: 'json' }
import pattern from '../generated/pattern.d.ts.json' assert { type: 'json' }
import recipe from '../generated/recipe.d.ts.json' assert { type: 'json' }
import selectors from '../generated/selectors.d.ts.json' assert { type: 'json' }
import staticCss from '../generated/static-css.d.ts.json' assert { type: 'json' }
import system from '../generated/system-types.d.ts.json' assert { type: 'json' }

export const typesCssTypeArtifact = new ArtifactFile({
  id: 'types/csstype.d.ts',
  fileName: 'csstype',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: () => csstype.content,
})

export const typesStaticCssArtifact = new ArtifactFile({
  id: 'types/static-css.d.ts',
  fileName: 'static-css',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: () => staticCss.content,
})

export const typesRecipeArtifact = new ArtifactFile({
  id: 'types/recipe.d.ts',
  fileName: 'recipe',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: (params) => {
    return params.file.rewriteTypeImport(recipe.content)
  },
})

export const typesPatternArtifact = new ArtifactFile({
  id: 'types/pattern.d.ts',
  fileName: 'pattern',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: (params) => {
    return params.file.rewriteTypeImport(pattern.content.replace('../tokens', '../tokens/index'))
  },
})

export const typesPartsArtifact = new ArtifactFile({
  id: 'types/parts.d.ts',
  fileName: 'parts',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: (params) => {
    return params.file.rewriteTypeImport(parts.content)
  },
})

export const typesCompositionArtifact = new ArtifactFile({
  id: 'types/composition.d.ts',
  fileName: 'composition',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: (params) => {
    return params.file.rewriteTypeImport(composition.content)
  },
})

export const typesSelectorsArtifact = new ArtifactFile({
  id: 'types/selectors.d.ts',
  fileName: 'selectors',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: [],
  code: (params) => {
    return params.file.rewriteTypeImport(selectors.content)
  },
})

const jsxStyleProps = 'export type JsxStyleProps = SystemStyleObject & WithCss'
export const typesSystemTypesArtifact = new ArtifactFile({
  id: 'types/system-types.d.ts',
  fileName: 'system-types',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['jsxFramework', 'jsxStyleProps'],
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    return params.file.rewriteTypeImport(
      match(params.computed.jsx.styleProps)
        .with('all', () => system.content)
        .with('minimal', () =>
          system.content
            .replace('WithHTMLProps<T>,', 'T,')
            .replace(jsxStyleProps, 'export type JsxStyleProps = WithCss'),
        )
        .with('none', () =>
          system.content.replace('WithHTMLProps<T>,', 'T,').replace(jsxStyleProps, 'export type JsxStyleProps = {}'),
        )
        .exhaustive(),
    )
  },
})
