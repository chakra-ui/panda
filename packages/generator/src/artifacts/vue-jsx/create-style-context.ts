import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

export function generateVueCreateStyleContext(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    ${ctx.file.import('cx, css, sva', '../css/index')}
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import('getDisplayName', './factory-helper')}
    import { defineComponent, provide, inject, computed, h } from 'vue'
    
    export function createStyleContext(recipe) {
      const StyleContext = Symbol('StyleContext')
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
        const WithRootProvider = defineComponent({
          props: svaFn.variantKeys,
          setup(props, { slots }) {
            const [variantProps, otherProps] = svaFn.splitVariantProps(props)

            const slotStyles = computed(() => {
              const styles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
              styles._classNameMap = svaFn.classNameMap
              return styles
            })

            provide(StyleContext, slotStyles)

            const mergedProps = computed(() => {
              if (!options?.defaultProps) return otherProps
              return { ...options.defaultProps, ...otherProps }
            })

            return () => h(Component, mergedProps.value, slots)
          },
        })
        
        const componentName = getDisplayName(Component)
        WithRootProvider.displayName = \`withRootProvider(\${componentName})\`
        
        return WithRootProvider
      }

      const withProvider = (Component, slot, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        
        const WithProvider = defineComponent({
          props: ["unstyled", ...svaFn.variantKeys],
          inheritAttrs: false,
          setup(inProps, { slots, attrs }) {
            const props = computed(() => {
              const propsWithClass = { ...inProps, ...attrs }
              propsWithClass.class = propsWithClass.class ?? options?.defaultProps?.class
              return propsWithClass
            })
            const res = computed(() => {
              const [variantProps, restProps] = svaFn.splitVariantProps(props.value)
              return { variantProps, restProps }
            })
            
            const slotStyles = computed(() => {
              const styles = isConfigRecipe ? svaFn(res.value.variantProps) : svaFn.raw(res.value.variantProps)
              styles._classNameMap = svaFn.classNameMap
              return styles
            })

            provide(StyleContext, slotStyles)

            return () => {
              const resolvedProps = getResolvedProps(res.value.restProps, slotStyles.value[slot])
              resolvedProps.class = cx(resolvedProps.class, slotStyles.value._classNameMap[slot], attrs.class)
              return h(StyledComponent, resolvedProps, slots)
            }
          },
        })
        
        const componentName = getDisplayName(Component)
        WithProvider.displayName = \`withProvider(\${componentName})\`
        
        return WithProvider
      }

      const withContext = (Component, slot, options) => {
        const StyledComponent = ${factoryName}(Component, {}, options)
        
        const WithContext = defineComponent({
          props: ["unstyled"],
          inheritAttrs: false,
          setup(inProps, { slots, attrs }) {
            const props = computed(() => {
              const propsWithClass = { ...inProps, ...attrs }
              propsWithClass.class = propsWithClass.class ?? options?.defaultProps?.class
              return propsWithClass
            })
            const slotStyles = inject(StyleContext)

            return () => {
              const resolvedProps = getResolvedProps(props.value, slotStyles.value[slot])
              resolvedProps.class = cx(resolvedProps.class, slotStyles.value._classNameMap[slot], attrs.class)
              return h(StyledComponent, resolvedProps, slots)
            }
          },
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
    ${ctx.file.importType('JsxFactoryOptions', '../types/jsx')}
    import type { Component, FunctionalComponent, NativeElements } from 'vue'

    interface UnstyledProps {
      unstyled?: boolean | undefined
    }

    interface WithProviderOptions<P = {}> {
      defaultProps?: Partial<P> | undefined
    }

    // Add v-model support types
    interface VModelProps {
      modelValue?: any
      'onUpdate:modelValue'?: (value: any) => void
    }

    type SvaFn<S extends string = any> = SlotRecipeRuntimeFn<S, any>
    interface SlotRecipeFn {
      __type: any
      __slot: string
      (props?: any): any
    }
    type SlotRecipe = SvaFn | SlotRecipeFn

    type InferSlot<R extends SlotRecipe> = R extends SlotRecipeFn ? R['__slot'] : R extends SvaFn<infer S> ? S : never

    type IntrinsicElement = keyof NativeElements
    type ElementType = IntrinsicElement | Component

    type ComponentProps<T extends ElementType> = T extends IntrinsicElement
      ? NativeElements[T]
      : T extends Component<infer Props>
      ? Props
      : never

    type StyleContextProvider<T extends ElementType, R extends SlotRecipe> = FunctionalComponent<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps & VModelProps, Assign<RecipeVariantProps<R>, JsxStyleProps>>
    >
    
    type StyleContextConsumer<T extends ElementType> = FunctionalComponent<
      JsxHTMLProps<ComponentProps<T> & UnstyledProps & VModelProps, JsxStyleProps>
    >

    export interface StyleContext<R extends SlotRecipe> {
      withRootProvider: <T extends ElementType>(
        Component: T,
        options?: WithProviderOptions<ComponentProps<T>> | undefined
      ) => StyleContextProvider<T, R>
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
