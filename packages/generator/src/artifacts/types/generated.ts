import type { Context } from '@pandacss/core'
import { match } from 'ts-pattern'
import composition from '../generated/composition.d.ts.json' assert { type: 'json' }
import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }
import parts from '../generated/parts.d.ts.json' assert { type: 'json' }
import pattern from '../generated/pattern.d.ts.json' assert { type: 'json' }
import recipe from '../generated/recipe.d.ts.json' assert { type: 'json' }
import selectors from '../generated/selectors.d.ts.json' assert { type: 'json' }
import staticCss from '../generated/static-css.d.ts.json' assert { type: 'json' }
import system from '../generated/system-types.d.ts.json' assert { type: 'json' }

export function getGeneratedTypes(ctx: Context) {
  return {
    cssType: csstype.content,
    static: staticCss.content,
    recipe: ctx.file.rewriteTypeImport(recipe.content),
    pattern: ctx.file.rewriteTypeImport(pattern.content.replace('../tokens', '../tokens/index')),
    parts: ctx.file.rewriteTypeImport(parts.content),
    composition: ctx.file.rewriteTypeImport(composition.content),
    selectors: ctx.file.rewriteTypeImport(selectors.content),
  }
}

const jsxStyleProps = 'export type JsxStyleProps = SystemStyleObject & WithCss'

export function getGeneratedSystemTypes(ctx: Context) {
  return {
    system: ctx.file.rewriteTypeImport(
      match(ctx.jsx.styleProps)
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
    ),
  }
}
