import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

export function generatePreactCreateStyleContext(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    ${ctx.file.import('cx, css, sva', '../css/index')}
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import('getDisplayName', './factory-helper')}
    import { createContext, useContext, createElement, forwardRef } from 'preact/compat'

    
    export function createStyleContext(recipe) {
      const StyleContext = createContext({})
      const isConfigRecipe = '__recipe__' in recipe
      const svaFn = isConfigRecipe ? recipe : sva(recipe.config)

      const getResolvedProps = (props, slotStyles) => {
        const { unstyled, ...restProps } = props
        if (unstyled) return restProps
        if (isConfigRecipe) {
           return { ...restProps, className: cx(slotStyles, restProps.className) }
        }
        ${outdent.string(
          match(ctx.config.jsxStyleProps)
            .with('all', () => `return { ...slotStyles, ...restProps }`)
            .with('minimal', () => `return { ...restProps, css: css.raw(slotStyles, restProps.css) }`)
            .with('none', () => `return { ...restProps, className: cx(css(slotStyles), restProps.className) }`)
            .otherwise(() => `return restProps`),
        )}
      }

      const withRootProvider = (Component, options) => {
        const WithRootProvider = (props) => {
          const [variantProps, otherProps] = svaFn.splitVariantProps(props)
          
          const slotStyles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
          slotStyles._classNameMap = svaFn.classNameMap

          const mergedProps = options?.defaultProps 
            ? { ...options.defaultProps, ...otherProps } 
            : otherProps

          return createElement(StyleContext.Provider, {
            value: slotStyles,
            children: createElement(Component, mergedProps)
          })
        }
        
        const componentName = getDisplayName(Component)
        WithRootProvider.displayName = \`withRootProvider(\${componentName})\`
        
        return WithRootProvider
      }

      const withProvider = (Component, slot, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        
        const WithProvider = forwardRef((props, ref) => {
          const [variantProps, restProps] = svaFn.splitVariantProps(props)
          
          const slotStyles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
          slotStyles._classNameMap = svaFn.classNameMap

          const propsWithClass = { ...restProps, className: restProps.className ?? options?.defaultProps?.className }
          const resolvedProps = getResolvedProps(propsWithClass, slotStyles[slot])
          return createElement(StyleContext.Provider, {
            value: slotStyles,
            children: createElement(StyledComponent, {
              ...resolvedProps,
              className: cx(resolvedProps.className, slotStyles._classNameMap[slot]),
              ref,
            })
          })
        })
        
        const componentName = getDisplayName(Component)
        WithProvider.displayName = \`withProvider(\${componentName})\`
        
        return WithProvider
      }

      const withContext = (Component, slot, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        
        const WithContext = forwardRef((props, ref) => {
          const slotStyles = useContext(StyleContext)
          
          const propsWithClass = { ...props, className: props.className ?? options?.defaultProps?.className }
          const resolvedProps = getResolvedProps(propsWithClass, slotStyles[slot])
          return createElement(StyledComponent, {
            ...resolvedProps,
            className: cx(resolvedProps.className, slotStyles._classNameMap[slot]),
            ref,
          })
        })
        
        const componentName = getDisplayName(Component)
        WithContext.displayName = \`withContext(\${componentName})\`
        
        return WithContext
      }

      return {
        withRootProvider,
        withProvider,
        withContext,
      }
    }
    `,
    dts: outdent`
    ${ctx.file.importType('SlotRecipeRuntimeFn, RecipeVariantProps', '../types/recipe')}
    ${ctx.file.importType('JsxHTMLProps, JsxStyleProps, Assign', '../types/system-types')}
    ${ctx.file.importType('JsxFactoryOptions, DataAttrs', '../types/jsx')}
    import type { ComponentType, ComponentProps, JSX } from 'preact/compat'

    interface UnstyledProps {
      unstyled?: boolean | undefined
    }

    interface WithProviderOptions<P = {}> {
      defaultProps?: (Partial<P> & DataAttrs) | undefined
    }

    type ElementType = JSX.ElementType

    type SvaFn<S extends string = any> = SlotRecipeRuntimeFn<S, any>
    interface SlotRecipeFn {
      __type: any
      __slot: string
      (props?: any): any
    }
    type SlotRecipe = SvaFn | SlotRecipeFn

    type InferSlot<R extends SlotRecipe> = R extends SlotRecipeFn ? R['__slot'] : R extends SvaFn<infer S> ? S : never

    type StyleContextProvider<T extends ElementType, R extends SlotRecipe> = ComponentType<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps, Assign<RecipeVariantProps<R>, JsxStyleProps>>
    >

    type StyleContextRootProvider<T extends ElementType, R extends SlotRecipe> = ComponentType<
      ComponentProps<T> & UnstyledProps & RecipeVariantProps<R>
    >

    type StyleContextConsumer<T extends ElementType> = ComponentType<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps, JsxStyleProps>
    >

    export interface StyleContext<R extends SlotRecipe> {
      withRootProvider: <T extends ElementType>(
        Component: T,
        options?: WithProviderOptions<ComponentProps<T>> | undefined
      ) => StyleContextRootProvider<T, R>
      withProvider: <T extends ElementType>(
        Component: T,
        slot: InferSlot<R>,
        options?: JsxFactoryOptions<ComponentProps<T>> | undefined
      ) => StyleContextProvider<T, R>
      withContext: <T extends ElementType>(
        Component: T,
        slot: InferSlot<R>,
        options?: JsxFactoryOptions<ComponentProps<T>> | undefined
      ) => StyleContextConsumer<T>
    }

    export declare function createStyleContext<R extends SlotRecipe>(recipe: R): StyleContext<R>
    `,
  }
}
