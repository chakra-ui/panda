/* eslint-disable */
import type { RecipeRuntimeFn, RecipeVariantProps, RecipeVariantRecord } from '../types/recipe';
import type { JsxHTMLProps, JsxStyleProps, Assign } from '../types/system-types';
import type { JsxFactoryOptions, ComponentProps, AsProps } from '../types/jsx';
import type { ElementType, ForwardRefExoticComponent, PropsWithoutRef, Provider, RefAttributes } from 'react'

interface UnstyledProps {
  unstyled?: boolean | undefined
}

interface RecipeFn {
  __type: any
  (props?: any): string
}

type AnyRecipe = RecipeRuntimeFn<RecipeVariantRecord> | RecipeFn

type InferVariantProps<R extends AnyRecipe> = R extends RecipeFn
  ? R['__type']
  : R extends RecipeRuntimeFn<infer _T>
    ? RecipeVariantProps<R>
    : never

interface RecipeContextOptions {
  key?: string
  recipe?: AnyRecipe
}

type RecipeContextConsumer<T extends ElementType, R extends AnyRecipe> = ForwardRefExoticComponent<
  PropsWithoutRef<JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, Assign<InferVariantProps<R>, JsxStyleProps>>> &
    RefAttributes<any>
>

export interface RecipeContext<R extends AnyRecipe> {
  withContext: <T extends ElementType>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => RecipeContextConsumer<T, R>
  PropsProvider: Provider<Partial<InferVariantProps<R>>>
  usePropsContext: () => InferVariantProps<R> | undefined
}

export declare function createRecipeContext<R extends AnyRecipe>(recipe: R): RecipeContext<R>
export declare function createRecipeContext(options: RecipeContextOptions): RecipeContext<AnyRecipe>