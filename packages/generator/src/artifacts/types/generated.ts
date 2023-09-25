import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }
import system from '../generated/system-types.d.ts.json' assert { type: 'json' }
import composition from '../generated/composition.d.ts.json' assert { type: 'json' }
import recipe from '../generated/recipe.d.ts.json' assert { type: 'json' }
import pattern from '../generated/pattern.d.ts.json' assert { type: 'json' }
import parts from '../generated/parts.d.ts.json' assert { type: 'json' }
import selectors from '../generated/selectors.d.ts.json' assert { type: 'json' }
import helpers from '../generated/helpers.d.ts.json' assert { type: 'json' }
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

const jsxStyleProps = 'export type JsxStyleProps = StyleProps & WithCss'

export function getGeneratedTypes(ctx: Context) {
  /**
   * convert import type { CompositionStyleObject } from './system-types'
   * to import type { CompositionStyleObject } from './system-types.d.ts'
   */
  const rewriteImports = (code: string) =>
    code.replace(/import\s+type\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, ctx.file.importType('$1', '$2'))

  return {
    cssType: csstype.content,
    recipe: rewriteImports(recipe.content),
    pattern: rewriteImports(pattern.content.replace('../tokens', '../tokens/index')),
    parts: rewriteImports(parts.content),
    composition: rewriteImports(composition.content),
    selectors: rewriteImports(selectors.content),
    helpers: rewriteImports(helpers.content),
    system: rewriteImports(
      match(ctx.jsx.styleProps)
        .with('all', () => system.content)
        .with('minimal', () => system.content.replace(jsxStyleProps, 'export type JsxStyleProps = WithCss'))
        .with('none', () => system.content.replace(jsxStyleProps, 'export type JsxStyleProps = {}'))
        .exhaustive(),
    ),
  }
}
