import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
import { ${upperName} } from '../types/jsx'
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, FunctionalComponent } from 'vue'
import type { Assign, JsxStyleProps, JsxHTMLProps } from './system-types'
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe'

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

  export type ${componentName}<T extends ElementType, P extends Dict = {}> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>
  >

  export type ${upperName}RecipeVariantProps<C> = C extends ${componentName}<any, infer P>
  ? P
  : never;

  type RecipeFn = { __type: any }

  interface JsxFactory {
    <T extends ElementType>(component: T): ${componentName}<T, {}>
    <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): ${componentName}<
      T,
      RecipeSelection<P>
    >
    <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): ${componentName}<T, P['__type']>
  }
  
  type JsxElements = { [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}> }
  
  export type ${upperName} = JsxFactory & JsxElements
    
  export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
