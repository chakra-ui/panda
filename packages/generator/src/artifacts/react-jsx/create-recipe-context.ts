import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateReactCreateRecipeContext(ctx: Context) {
  const { factoryName } = ctx.jsx
  const hasRecipes = !ctx.recipes.isEmpty()

  return {
    js: outdent`'use client'\n
    ${ctx.file.import('cx, css, cva', '../css/index')}
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import('getDisplayName', './factory-helper')}
    ${hasRecipes ? `import * as recipes from '${ctx.file.ext('../recipes/index')}'` : ''}
    import { createContext, useContext, createElement, forwardRef } from 'react'

    function resolveRecipe(options) {
      if (options == null) {
        throw new Error('createRecipeContext requires a recipe or { key }')
      }
      if (options.__recipe__ === true || options.__cva__ != null) return options
      ${hasRecipes ? `if (options.key) return recipes[options.key]` : ''}
      if (options.recipe) return options.recipe
      throw new Error('createRecipeContext requires a recipe or { key }')
    }

    export function createRecipeContext(options) {
      const recipe = resolveRecipe(options)
      const isConfigRecipe = recipe.__recipe__ === true
      const cvaFn = isConfigRecipe ? recipe : cva(recipe)

      const PropsContext = createContext(undefined)
      const usePropsContext = () => useContext(PropsContext)

      const withContext = (Component, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        const componentName = getDisplayName(Component)

        const WithContext = forwardRef((inProps, ref) => {
          const propsContext = usePropsContext()
          const props = propsContext ? { ...propsContext, ...inProps } : inProps
          const { unstyled, ...restProps } = props

          const [variantProps, otherProps] = cvaFn.splitVariantProps(restProps)

          let className
          if (unstyled) {
            className = cx(props.className)
          } else if (isConfigRecipe) {
            className = cx(cvaFn(variantProps), props.className)
          } else {
            className = cx(css(cvaFn.raw(variantProps)), props.className)
          }

          return createElement(StyledComponent, {
            ...otherProps,
            className,
            ref,
          })
        })

        WithContext.displayName = componentName
        return WithContext
      }

      return {
        withContext,
        PropsProvider: PropsContext.Provider,
        usePropsContext,
      }
    }
    `,
    dts: outdent`
    ${ctx.file.importType('RecipeRuntimeFn, RecipeVariantProps, RecipeVariantRecord', '../types/recipe')}
    ${ctx.file.importType('JsxHTMLProps, JsxStyleProps, Assign', '../types/system-types')}
    ${ctx.file.importType('JsxFactoryOptions, ComponentProps, AsProps', '../types/jsx')}
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
    `,
  }
}
