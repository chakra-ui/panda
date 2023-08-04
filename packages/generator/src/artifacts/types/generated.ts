import csstype from '../generated/csstype.d.ts.json' assert { type: 'json' }
import system from '../generated/system-types.d.ts.json' assert { type: 'json' }
import composition from '../generated/composition.d.ts.json' assert { type: 'json' }
import recipe from '../generated/recipe.d.ts.json' assert { type: 'json' }
import pattern from '../generated/pattern.d.ts.json' assert { type: 'json' }
import parts from '../generated/parts.d.ts.json' assert { type: 'json' }
import selectors from '../generated/selectors.d.ts.json' assert { type: 'json' }
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

const jsxStyleProps = 'export type JsxStyleProps = StyleProps & WithCss'

export function getGeneratedTypes(ctx: Context) {
  return {
    cssType: csstype.content,
    recipe: recipe.content,
    pattern: pattern.content,
    parts: parts.content,
    composition: composition.content,
    selectors: selectors.content,
    system: match(ctx.jsx.styleProps)
      .with('all', () => system.content)
      .with('minimal', () => system.content.replace(jsxStyleProps, 'export type JsxStyleProps = WithCss'))
      .with('none', () => system.content.replace(jsxStyleProps, 'export type JsxStyleProps = {}'))
      .exhaustive(),
  }
}
