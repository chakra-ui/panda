/* eslint-disable */
import type { ComponentPropsWithoutRef, ElementType, ElementRef, Ref } from 'react'
import type { Assign, DistributiveOmit, JsxHTMLProps, JsxStyleProps } from './system-types';
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe';

type Dict = Record<string, unknown>

export type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
  ref?: Ref<ElementRef<T>>
}

export interface PandaComponent<T extends ElementType, P extends Dict = {}> {
  (props: JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>): JSX.Element
  displayName?: string
}

interface RecipeFn { __type: any }

interface FactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: TProps
  shouldForwardProp?(prop: string, isCssProperty: (prop: string) => boolean, variantKeys: string[]): boolean
}

export type JsxRecipeProps<T extends ElementType, P extends RecipeFn> = JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P['__type']>>;

interface JsxFactory {
  <T extends ElementType>(component: T): PandaComponent<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>, options?: FactoryOptions<JsxRecipeProps<T, P>>): PandaComponent<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P, options?: FactoryOptions<JsxRecipeProps<T, P>>): PandaComponent<T, P['__type']>
}

type JsxElements = { [K in keyof JSX.IntrinsicElements]: PandaComponent<K, {}> }

export type Panda = JsxFactory & JsxElements

export type HTMLPandaProps<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>