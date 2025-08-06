import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

export function generateSolidCreateStyleContext(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    ${ctx.file.import('cx, css, sva', '../css/index')}
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import('getDisplayName', './factory-helper')}
    import { createComponent, mergeProps } from 'solid-js/web'
    import { createContext, useContext, createMemo } from 'solid-js'

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
            .with('none', () => `return { ...restProps, class: cx(css(slotStyles), restProps.class) }`)
            .otherwise(() => `return restProps`),
        )}
      }
      

      const withRootProvider = (Component) => {
        const WithRootProvider = (props) => {
          const finalProps = createMemo(() => {
            const [variantProps, restProps] = svaFn.splitVariantProps(props)
            
            const slotStyles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
            slotStyles._classNameMap = svaFn.classNameMap
      
            return { restProps, slotStyles }
          })

          return createComponent(StyleContext.Provider, {
            value: finalProps().slotStyles,
            get children() {
              return createComponent(
                Component,
                mergeProps(finalProps().restProps, {
                  get children() {
                    return props.children
                  },
                }),
              )
            },
          })
        }
        
        const componentName = getDisplayName(Component)
        WithRootProvider.displayName = \`withRootProvider(\${componentName})\`
        
        return WithRootProvider
      }

      const withProvider = (Component, slot, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        
        const WithProvider = (props) => {
          const finalProps = createMemo(() => {
            const [variantProps, restProps] = svaFn.splitVariantProps(props)

            const slotStyles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
            slotStyles._classNameMap = svaFn.classNameMap

            const propsWithClass = { ...restProps, class: restProps.class ?? options?.defaultProps?.class }
            const resolvedProps = getResolvedProps(propsWithClass, slotStyles[slot])
            resolvedProps.class = cx(resolvedProps.class, slotStyles._classNameMap[slot])
            
            return { slotStyles, resolvedProps }
          })

          return createComponent(StyleContext.Provider, {
            value: finalProps().slotStyles,
            get children() {
              return createComponent(
                StyledComponent,
                mergeProps(finalProps().resolvedProps, {
                  get children() {
                    return props.children
                  },
                }),
              )
            },
          })
        }
        
        const componentName = getDisplayName(Component)
        WithProvider.displayName = \`withProvider(\${componentName})\`
        
        return WithProvider
      }

      const withContext = (Component, slot, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        
        const WithContext = (props) => {
          const slotStyles = useContext(StyleContext)
          const finalProps = createMemo(() => {
            const propsWithClass = { ...props, class: props.class ?? options?.defaultProps?.class }
            const resolvedProps = getResolvedProps(propsWithClass, slotStyles[slot])
            resolvedProps.class = cx(resolvedProps.class, slotStyles._classNameMap?.[slot])
            return resolvedProps
          })

          return createComponent(StyledComponent, finalProps())
        }
        
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
    ${ctx.file.importType('JsxFactoryOptions', '../types/jsx')}
    import type { Component, JSX, ComponentProps } from 'solid-js'

    interface UnstyledProps {
      unstyled?: boolean
    }
    type ElementType<P extends Record<string, any> = {}> = keyof JSX.IntrinsicElements | Component<P>

    type SvaFn<S extends string = any> = SlotRecipeRuntimeFn<S, any>
    interface SlotRecipeFn {
      __type: any
      __slot: string
      (props?: any): any
    }
    type SlotRecipe = SvaFn | SlotRecipeFn

    type InferSlot<R extends SlotRecipe> = R extends SlotRecipeFn ? R['__slot'] : R extends SvaFn<infer S> ? S : never

    type StyleContextProvider<T extends ElementType, R extends SlotRecipe> = Component<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps, Assign<RecipeVariantProps<R>, JsxStyleProps>>
    >
    
    type StyleContextConsumer<T extends ElementType> = Component<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps, JsxStyleProps>
    >

    export interface StyleContext<R extends SlotRecipe> {
      withRootProvider: <T extends ElementType>(Component: T) => StyleContextProvider<T, R>
      withProvider: <T extends ElementType>(
        Component: T,
        slot: InferSlot<R>,
        options?: JsxFactoryOptions<ComponentProps<T>>
      ) => StyleContextProvider<T, R>
      withContext: <T extends ElementType>(
        Component: T,
        slot: InferSlot<R>,
        options?: JsxFactoryOptions<ComponentProps<T>>
      ) => StyleContextConsumer<T>
    }

    export declare function createStyleContext<R extends SlotRecipe>(recipe: R): StyleContext<R>
    `,
  }
}
