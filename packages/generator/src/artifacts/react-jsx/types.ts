import { ArtifactFile } from '../artifact-map'

export const reactJsxFactoryTypesArtifact = new ArtifactFile({
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

export const reactJsxTypesArtifact = new ArtifactFile({
  id: 'types/jsx.d.ts',
  fileName: 'jsx',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['jsxFactory'],
  importsType: {
    'types/recipe.d.ts': ['RecipeDefinition, RecipeSelection, RecipeVariantRecord'],
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
    import type { ComponentPropsWithoutRef, ElementType, ElementRef, JSX, Ref } from 'react'

    interface Dict {
      [k: string]: unknown
    }

    export type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
      ref?: Ref<ElementRef<T>>
    }

    export interface ${componentName}<T extends ElementType, P extends Dict = {}> {
      (props: JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>): JSX.Element
      displayName?: string
    }

    interface RecipeFn {
      __type: any
    }

    interface JsxFactoryOptions<TProps extends Dict> {
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
