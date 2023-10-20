import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxTypes(ctx: Context) {
  const { factoryName, componentName, upperName, typeName } = ctx.jsx

  return {
    jsxFactory: outdent`
${ctx.file.importType(upperName, '../types/jsx')}

export declare const ${factoryName}: ${upperName}
    `,
    jsxType: outdent`
import type { Component, FunctionalComponent, NativeElements } from 'vue'

${ctx.file.importType('RecipeDefinition, RecipeSelection, RecipeVariantRecord', './recipe')}
${ctx.file.importType(
  'Assign, DistributiveOmit, DistributiveUnion, JsxHTMLProps, JsxStyleProps, Pretty',
  './system-types',
)}

export type IntrinsicElement = keyof NativeElements

export type ElementType = IntrinsicElement | Component

export type ComponentProps<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
  ? Props
  : never

export interface ${componentName}<T extends ElementType, P extends Dict = {}> extends FunctionalComponent<
  JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>
> {}

interface RecipeFn {
  __type: any
}

export interface JsxFactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: TProps
  shouldForwardProp?(prop: string, variantKeys: string[]): boolean
}

export type JsxRecipeProps<T extends ElementType, P extends RecipeFn> = JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P['__type']>>;

export type JsxElement<T extends ElementType, P> = T extends ${componentName}<infer A, infer B>
  ? ${componentName}<A, Pretty<DistributiveUnion<P, B>>>
  : ${componentName}<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): ${componentName}<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P['__type']>> ): JsxElement<T, P['__type']>
}

export type JsxElements = {
  [K in IntrinsicElement]: ${componentName}<K, {}>
}

export type ${upperName} = JsxFactory & JsxElements

export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>
  `,
  }
}
