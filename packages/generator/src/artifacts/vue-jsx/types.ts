import { ArtifactFile } from '../artifact'

export const vueJsxFactoryTypesArtifact = new ArtifactFile({
  id: 'jsx/factory.d.ts',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory', 'jsxFramework'],
  importsType: (ctx) => {
    return {
      'types/jsx.d.ts': [ctx.jsx.upperName],
    }
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { factoryName, upperName } = params.computed.jsx
    return `export declare const ${factoryName}: ${upperName}`
  },
})

export const vueJsxTypesArtifact = new ArtifactFile({
  id: 'jsx/factory.d.ts',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory', 'jsxFramework'],
  importsType: {
    'recipes/index.d.ts': ['RecipeDefinition, RecipeSelection, RecipeVariantRecord'],
    'types/system-types.d.ts': ['Assign, DistributiveOmit, DistributiveUnion, JsxHTMLProps, JsxStyleProps, Pretty'],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, upperName, typeName, variantName } = params.computed.jsx
    return `
    import type { Component, FunctionalComponent, NativeElements } from 'vue'

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

    export type ${variantName}<T extends ${componentName}<any, any>> = T extends ${componentName}<any, infer Props> ? Props : never
      `
  },
})
