/* eslint-disable */
import type { SlotRecipeRuntimeFn, RecipeVariantProps } from '../types/recipe';
import type { JsxHTMLProps, JsxStyleProps, Assign } from '../types/system-types';
import type { JsxFactoryOptions, ComponentProps, DataAttrs, AsProps } from '../types/jsx';
import type { ComponentType, ElementType } from 'react'

interface UnstyledProps {
  unstyled?: boolean | undefined
}

type SvaFn<S extends string = any> = SlotRecipeRuntimeFn<S, any>
interface SlotRecipeFn {
  __type: any
  __slot: string
  (props?: any): any
}
type SlotRecipe = SvaFn | SlotRecipeFn

type InferSlot<R extends SlotRecipe> = R extends SlotRecipeFn ? R['__slot'] : R extends SvaFn<infer S> ? S : never

interface WithProviderOptions<P = {}> {
  defaultProps?: (Partial<P> & DataAttrs) | undefined
}

type SlotContextProvider<T extends ElementType, R extends SlotRecipe> = ComponentType<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, Assign<RecipeVariantProps<R>, JsxStyleProps>>
>

type SlotContextRootProvider<T extends ElementType, R extends SlotRecipe> = ComponentType<
  ComponentProps<T> & UnstyledProps & RecipeVariantProps<R>
>

type SlotContextConsumer<T extends ElementType> = ComponentType<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, JsxStyleProps>
>

interface SlotRecipeContextOptions {
  key?: string
  recipe?: SlotRecipe
}

export interface SlotRecipeContext<R extends SlotRecipe> {
  withRootProvider: <T extends ElementType>(
    Component: T,
    options?: WithProviderOptions<ComponentProps<T>> | undefined
  ) => SlotContextRootProvider<T, R>
  withProvider: <T extends ElementType>(
    Component: T,
    slot: InferSlot<R>,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => SlotContextProvider<T, R>
  withContext: <T extends ElementType>(
    Component: T,
    slot: InferSlot<R>,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => SlotContextConsumer<T>
}

export declare function createSlotRecipeContext<R extends SlotRecipe>(recipe: R): SlotRecipeContext<R>
export declare function createSlotRecipeContext(options: SlotRecipeContextOptions): SlotRecipeContext<SlotRecipe>