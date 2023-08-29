import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxTypes(ctx: Context) {
  const { factoryName, styleProps, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}

export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, FunctionalComponent } from 'vue'

${ctx.file.importType('RecipeDefinition, RecipeSelection, RecipeVariantRecord', './recipe')}
${ctx.file.importType('Assign, JsxStyleProps, JsxHTMLProps', './system-types')}

type IntrinsicElement =
  | 'a'
  | 'abbr'
  | 'address'
  | 'area'
  | 'article'
  | 'aside'
  | 'audio'
  | 'b'
  | 'base'
  | 'bdi'
  | 'bdo'
  | 'blockquote'
  | 'body'
  | 'br'
  | 'button'
  | 'canvas'
  | 'caption'
  | 'cite'
  | 'code'
  | 'col'
  | 'colgroup'
  | 'data'
  | 'datalist'
  | 'dd'
  | 'del'
  | 'details'
  | 'dfn'
  | 'dialog'
  | 'div'
  | 'dl'
  | 'dt'
  | 'em'
  | 'embed'
  | 'fieldset'
  | 'figcaption'
  | 'figure'
  | 'footer'
  | 'form'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'head'
  | 'header'
  | 'hgroup'
  | 'hr'
  | 'html'
  | 'i'
  | 'iframe'
  | 'img'
  | 'input'
  | 'ins'
  | 'kbd'
  | 'label'
  | 'legend'
  | 'li'
  | 'link'
  | 'main'
  | 'map'
  | 'mark'
  | 'math'
  | 'menu'
  | 'menuitem'
  | 'meta'
  | 'meter'
  | 'nav'
  | 'noscript'
  | 'object'
  | 'ol'
  | 'optgroup'
  | 'option'
  | 'output'
  | 'p'
  | 'param'
  | 'picture'
  | 'pre'
  | 'progress'
  | 'q'
  | 'rb'
  | 'rp'
  | 'rt'
  | 'rtc'
  | 'ruby'
  | 's'
  | 'samp'
  | 'script'
  | 'section'
  | 'select'
  | 'slot'
  | 'small'
  | 'source'
  | 'span'
  | 'strong'
  | 'style'
  | 'sub'
  | 'summary'
  | 'sup'
  | 'svg'
  | 'table'
  | 'tbody'
  | 'td'
  | 'template'
  | 'textarea'
  | 'tfoot'
  | 'th'
  | 'thead'
  | 'time'
  | 'title'
  | 'tr'
  | 'track'
  | 'u'
  | 'ul'
  | 'var'
  | 'video'
  | 'wbr'

  type ElementType = IntrinsicElement | Component

  type ComponentProps<T extends ElementType> = T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : T extends Component<infer Props>
    ? Props
    : never

  type ${componentName}<T extends ElementType, P extends Dict = {}> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>
  >

  type RecipeFn = { __type: any }

  interface JsxFactory {
    ${styleProps === 'none' ? '' : `<T extends ElementType>(component: T): ${componentName}<T, {}>`}
    <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
      T,
      RecipeSelection<P>
    >
    <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
  }

  type JsxElements = { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }

  export type ${upperName} = JsxFactory ${styleProps === 'none' ? '' : '& JsxElements'}

  export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
