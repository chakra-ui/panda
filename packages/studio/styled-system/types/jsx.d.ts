/* eslint-disable */
import type { ComponentPropsWithoutRef, ElementType, ElementRef, Ref } from 'react'
import type { Assign, DistributiveOmit, JsxHTMLProps, JsxStyleProps } from './system-types';
import type { RecipeDefinition, RecipeSelection, RecipeVariantRecord } from './recipe';

type Dict = Record<string, unknown>

type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
  ref?: Ref<ElementRef<T>>
}

export type PandaComponent<T extends ElementType, P extends Dict = {}> = {
  (props: JsxHTMLProps<ComponentProps<T>, Assign<JsxStyleProps, P>>): JSX.Element
  displayName?: string
}

type RecipeFn = { __type: any }

interface JsxFactory {
  <T extends ElementType>(component: T): PandaComponent<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>): PandaComponent<
    T,
    RecipeSelection<P>
  >
  <T extends ElementType, P extends RecipeFn>(component: T, recipeFn: P): PandaComponent<T, P['__type']>
}

type JsxElements = { [K in keyof JSX.IntrinsicElements]: PandaComponent<K, {}> }

export type Panda = JsxFactory & JsxElements

export type HTMLPandaProps<T extends ElementType> = JsxHTMLProps<ComponentProps<T>, JsxStyleProps>