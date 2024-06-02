import { ArtifactFile } from '../artifact-map'

export const solidJsxFactoryTypesArtifact = new ArtifactFile({
  id: 'jsx/factory.d.ts',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['jsxFactory'],
  imports: (ctx) => ({
    'types/jsx.d.ts': [ctx.jsx.upperName],
  }),
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { factoryName, upperName } = params.computed.jsx

    return `export declare const ${factoryName}: ${upperName}`
  },
})

export const solidJsxTypesArtifact = new ArtifactFile({
  id: 'types/jsx.d.ts',
  fileName: 'jsx',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['jsxFactory'],
  imports: {
    'types/recipe.d.ts': ['RecipeDefinition', 'RecipeSelection', 'RecipeVariantRecord'],
    'types/system-types.d.ts': [
      'Assign',
      'DistributiveOmit',
      'DistributiveUnion',
      'JsxHTMLProps',
      'JsxStyleProps',
      'Pretty',
    ],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, upperName, typeName, variantName } = params.computed.jsx

    return `
    import type { ComponentProps, Component, JSX } from 'solid-js'

    interface Dict {
      [k: string]: unknown
    }

    export type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>

    export interface ${componentName}<T extends ElementType, P extends Dict = {}> {
      (props: JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>): JSX.Element
      displayName?: string
    }

    interface RecipeFn {
      __type: any
    }

    export interface JsxFactoryOptions<TProps extends Dict> {
      dataAttr?: boolean
      defaultProps?: TProps
      shouldForwardProp?(prop: string, variantKeys: string[]): boolean
    }

    export type JsxRecipeProps<T extends ElementType, P extends Dict> = JsxHTMLProps<ComponentProps<T>, P>;

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
      [K in keyof JSX.IntrinsicElements]: ${componentName}<K, {}>
    }

    export type ${upperName} = JsxFactory & JsxElements

    export type ${typeName}<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>

    export type ${variantName}<T extends ${componentName}<any, any>> = T extends ${componentName}<any, infer Props> ? Props : never
      `
  },
})
