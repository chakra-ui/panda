import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import isValidPropJson from '../generated/is-valid-prop.mjs.json' assert { type: 'json' }

const cssPropRegex = /var cssPropertiesStr = ".*?";/
const memoFnDeclarationRegex = /function memo(.+?)\nvar cssPropertySelectorRegex/s

export function generateIsValidProp(ctx: Context) {
  if (ctx.isTemplateLiteralSyntax) return
  let content = isValidPropJson.content

  // replace user generated props by those from ctx, `css` or nothing
  content = content.replace(
    'var userGeneratedStr = "";',
    `var userGeneratedStr = "${match(ctx.jsx.styleProps)
      .with('all', () => Array.from(ctx.properties).join(','))
      .with('minimal', () => 'css')
      .with('none', () => '')
      .exhaustive()}"`,
  )

  // replace memo function declaration with an import from helpers
  content = content.replace(memoFnDeclarationRegex, 'var cssPropertySelectorRegex')

  // remove browser CSS props / memo function call when not needed
  if (ctx.jsx.styleProps === 'minimal' || ctx.jsx.styleProps === 'none') {
    content = content.replace('/* @__PURE__ */ memo(', '/* @__PURE__ */ (')
    content = content.replace(cssPropRegex, 'var cssPropertiesStr = "";')
  } else {
    // we want memo if we're using style props
    content = ctx.file.import('memo', '../helpers') + '\n' + content
  }

  content = ctx.file.import('splitProps', '../helpers') + '\n' + content
  content += `export const splitCssProps = (props) =>  splitProps(props, isCssProperty)`

  return {
    js: content,
    dts: outdent`
    import type { DistributiveOmit, HTMLPandaProps, JsxStyleProps, Pretty } from '../types';

    declare const isCssProperty: (value: string) => boolean;
    
    type CssPropKey = keyof JsxStyleProps
    type PickedCssProps<T> = Pretty<Pick<T, CssPropKey>>
    type OmittedCssProps<T> = Pretty<DistributiveOmit<T, CssPropKey>>

    declare const splitCssProps: <T>(props: T) => [PickedCssProps<T>, OmittedCssProps<T>]

    export { isCssProperty, splitCssProps };
    `,
  }
}
