import { ArtifactFile } from '../artifact'

export const qwikJsxFactoryTypesArtifact = new ArtifactFile({
  id: 'jsx/factory.d.ts',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory'],
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

export const qwikJsxTypesArtifact = new ArtifactFile({
  id: 'types/jsx.d.ts',
  fileName: 'jsx',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory'],
  imports: {
    'types/recipe.d.ts': ['RecipeDefinition, RecipeSelection, RecipeVariantRecord'],
    'types/system-types.d.ts': ['Assign, DistributiveOmit, DistributiveUnion, JsxStyleProps, PatchedHTMLProps, Pretty'],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, upperName, typeName, variantName } = params.computed.jsx
    return `
    import type { Component, QwikIntrinsicElements } from '@builder.io/qwik'

    export type ElementType = keyof QwikIntrinsicElements | Component<any>

    export type ComponentProps<T extends ElementType> = T extends keyof QwikIntrinsicElements
      ? QwikIntrinsicElements[T]
      : T extends Component<infer P>
      ? P
      : never

    interface Dict {
      [k: string]: unknown
    }

    export interface ${componentName}<T extends ElementType, P extends Dict = {}> extends Component<Assign<ComponentProps<T>, Assign<PatchedHTMLProps, Assign<JsxStyleProps, P>>>> {}

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
      [K in keyof QwikIntrinsicElements]: ${componentName}<K, {}>
    }

    export type ${upperName} = JsxFactory & JsxElements

    export type ${typeName}<T extends ElementType> = Assign<ComponentProps<T>, JsxStyleProps>

    export type ${variantName}<T extends ${componentName}<any, any>> = T extends ${componentName}<any, infer Props> ? Props : never
      `
  },
})
