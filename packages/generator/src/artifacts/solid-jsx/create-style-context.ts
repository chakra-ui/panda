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
    import { createContext, createMemo, splitProps, useContext } from 'solid-js'

    export function createStyleContext(recipe) {
      const StyleContext = createContext({})
      const isConfigRecipe = '__recipe__' in recipe
      const svaFn = isConfigRecipe ? recipe : sva(recipe.config)

      const getResolvedProps = (props, slotStyles) => {
        const { unstyled, ...restProps } = props
        if (unstyled) return restProps
        if (isConfigRecipe) {
          return { ...restProps, class: cx(slotStyles, restProps.class) }
        }
        ${outdent.string(
          match(ctx.config.jsxStyleProps)
            .with('all', () => `return { ...slotStyles, ...restProps }`)
            .with('minimal', () => `return { ...restProps, css: css.raw(slotStyles, restProps.css) }`)
            .with('none', () => `return { ...restProps, class: cx(css(slotStyles), restProps.class) }`)
            .otherwise(() => `return restProps`),
        )}
      }

      const withRootProvider = (Component, options) => {
        const WithRootProvider = (props) => {
          const [variantProps, otherProps] = svaFn.splitVariantProps(props)
          const [local, propsWithoutChildren] = splitProps(otherProps, ['children'])

          const slotStyles = createMemo(() => {
            const styles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
            styles._classNameMap = svaFn.classNameMap
            return styles
          })
            
          const mergedProps = createMemo(() => {
            if (!options?.defaultProps) return propsWithoutChildren
            return { ...options.defaultProps, ...propsWithoutChildren }
          })

          return createComponent(StyleContext.Provider, {
            get value() {
              return slotStyles()
            },
            get children() {
              return createComponent(
                Component,
                mergeProps(mergedProps, {
                  get children() {
                    return local.children
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
          const [variantProps, restProps] = svaFn.splitVariantProps(props)
          const [local, propsWithoutChildren] = splitProps(restProps, ["children"])

          const slotStyles = createMemo(() => {
            const styles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
            styles._classNameMap = svaFn.classNameMap
            return styles
          })

          const resolvedProps = createMemo(() => {
            const propsWithClass = {
              ...propsWithoutChildren,
              class: propsWithoutChildren.class ?? options?.defaultProps?.class,
            }
            const resolved = getResolvedProps(propsWithClass, slotStyles()[slot])
            resolved.class = cx(resolved.class, slotStyles()._classNameMap[slot])
            return resolved
          })

          return createComponent(StyleContext.Provider, {
            get value() {
              return slotStyles()
            },
            get children() {
              return createComponent(
                StyledComponent,
                mergeProps(resolvedProps, {
                  get children() {
                    return local.children
                  },
                })
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
          const [local, propsWithoutChildren] = splitProps(props, ["children"])

          const resolvedProps = createMemo(() => {
            const propsWithClass = {
              ...propsWithoutChildren,
              class: propsWithoutChildren.class ?? options?.defaultProps?.class,
            }
            const resolved = getResolvedProps(propsWithClass, slotStyles[slot])
            resolved.class = cx(resolved.class, slotStyles._classNameMap?.[slot])
            return resolved
          })

          return createComponent(
            StyledComponent,
            mergeProps(resolvedProps, {
              get children() {
                return local.children
              },
            })
          )
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
    ${ctx.file.importType('JsxFactoryOptions, DataAttrs', '../types/jsx')}
    import type { Component, JSX, ComponentProps } from 'solid-js'

    interface UnstyledProps {
      unstyled?: boolean | undefined
    }

    interface WithProviderOptions<P> {
      defaultProps?: (Partial<P> & DataAttrs) | undefined
    }
    
    type ElementType = keyof JSX.IntrinsicElements | Component<any>

    type SvaFn<S extends string = any> = SlotRecipeRuntimeFn<S, any>
    interface SlotRecipeFn {
      __type: any
      __slot: string
      (props?: any): any
    }
    type SlotRecipe = SvaFn | SlotRecipeFn

    type InferSlot<R extends SlotRecipe> = R extends SlotRecipeFn
      ? R['__slot']
      : R extends SvaFn<infer S>
        ? S
        : never

    type StyleContextProvider<T extends ElementType, R extends SlotRecipe> = Component<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps, Assign<RecipeVariantProps<R>, JsxStyleProps>>
    >

    type StyleContextRootProvider<T extends ElementType, R extends SlotRecipe> = Component<
      ComponentProps<T> & UnstyledProps & RecipeVariantProps<R>
    >

    type StyleContextConsumer<T extends ElementType> = Component<
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
