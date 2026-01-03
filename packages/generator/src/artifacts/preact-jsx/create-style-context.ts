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
    import { createContext } from 'preact'
    import { useContext } from 'preact/hooks'
    import { createElement, forwardRef } from 'preact/compat'

    function createSafeContext(contextName) {
      const Context = createContext(undefined)
      const useStyleContext = (componentName, slot) => {
        const context = useContext(Context)
        if (context === undefined) {
          const componentInfo = componentName ? \`Component "\${componentName}"\` : 'A component'
          const slotInfo = slot ? \` (slot: "\${slot}")\` : ''
          
          throw new Error(
            \`\${componentInfo}\${slotInfo} cannot access \${contextName} because it's missing its Provider.\`
          )
        }
        return context
      }
      return [Context, useStyleContext]
    }

    export function createStyleContext(recipe) {
      const isConfigRecipe = '__recipe__' in recipe
      const recipeName = isConfigRecipe && recipe.__name__ ? recipe.__name__ : undefined
      const contextName = recipeName ? \`createStyleContext("\${recipeName}")\` : 'createStyleContext'
      
      const [StyleContext, useStyleContext] = createSafeContext(contextName)
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
        
        const WithProvider = forwardRef(function WithProvider(props, ref) {
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
        const componentName = getDisplayName(Component)
        
        const WithContext = forwardRef(function WithContext(props, ref) {
          const slotStyles = useStyleContext(componentName, slot)
          
          const propsWithClass = { ...props, className: props.className ?? options?.defaultProps?.className }
          const resolvedProps = getResolvedProps(propsWithClass, slotStyles[slot])
          return createElement(StyledComponent, {
            ...resolvedProps,
            className: cx(resolvedProps.className, slotStyles._classNameMap[slot]),
            ref,
          })
        })
        
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
    ${ctx.file.importType('JsxFactoryOptions, DataAttrs, AsProps', '../types/jsx')}
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
      JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, Assign<RecipeVariantProps<R>, JsxStyleProps>>
    >

    type StyleContextRootProvider<T extends ElementType, R extends SlotRecipe> = ComponentType<
      ComponentProps<T> & UnstyledProps & RecipeVariantProps<R>
    >

    type StyleContextConsumer<T extends ElementType> = ComponentType<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, JsxStyleProps>
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
