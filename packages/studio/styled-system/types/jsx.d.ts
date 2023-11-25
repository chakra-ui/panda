/* eslint-disable */
import type { ComponentPropsWithoutRef, ElementType, ElementRef, Ref } from 'react'
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe';
import type { Assign, DistributiveOmit, DistributiveUnion, JsxHTMLProps, JsxStyleProps, Pretty } from './system-types';

interface Dict {
  [k: string]: unknown
}

export type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
  ref?: Ref<ElementRef<T>>
}

export interface PandaComponent<T extends ElementType, P extends Dict = {}> {
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

export type JsxElement<T extends ElementType, P extends Dict> = T extends PandaComponent<infer A, infer B>
  ? PandaComponent<A, Pretty<DistributiveUnion<P, B>>>
  : PandaComponent<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): PandaComponent<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P['__type']>>): JsxElement<T, P['__type']>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: PandaComponent<K, {}>
}

export type Panda = JsxFactory & JsxElements

export type HTMLPandaProps<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>

export type PandaVariantProps<T extends PandaComponent<any, any>> = T extends PandaComponent<any, infer Props> ? Props : never