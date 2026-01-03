import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateQwikJsxTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName, variantName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}
export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, QwikIntrinsicElements } from '@builder.io/qwik'
${ctx.file.importType('RecipeDefinition, RecipeSelection, RecipeVariantRecord', './recipe')}
${ctx.file.importType(
  'Assign, DistributiveOmit, DistributiveUnion, JsxStyleProps, PatchedHTMLProps, Pretty',
  './system-types',
)}

export type ElementType = keyof QwikIntrinsicElements | Component<any>

export type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends Component<infer P>
  ? P
  : never

interface Dict {
  [k: string]: unknown
}

export type DataAttrs = Record<\`data-\${string}\`, unknown>

export interface UnstyledProps {
  /**
   * Whether to remove recipe styles
   */
  unstyled?: boolean | undefined
}

export interface AsProps {
  /**
   * The element to render as
   */
  as?: ElementType | undefined
}

export interface ${componentName}<T extends ElementType, P extends Dict = {}> extends Component<Assign<ComponentProps<T> & UnstyledProps & AsProps, Assign<PatchedHTMLProps, Assign<JsxStyleProps, P>>>> {}

interface RecipeFn {
  __type: any
}

export interface JsxFactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: string[]
}

export type JsxRecipeProps<T extends ElementType, P extends Dict> = JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, P>;

export type JsxElement<T extends ElementType, P extends Dict> = T extends ${componentName}<infer A, infer B>
  ? ${componentName}<A, Pretty<DistributiveUnion<P, B>>>
  : ${componentName}<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P['__type']>>): JsxElement<T, P['__type']>
}

export type JsxElements = {
  [K in keyof QwikIntrinsicElements]: ${componentName}<K, {}>
}

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = Assign<ComponentProps<T> & UnstyledProps & AsProps, JsxStyleProps>

export type ${variantName}<T extends ${componentName}<any, any>> = T extends ${componentName}<any, infer Props> ? Props : never
  `,
  }
}
