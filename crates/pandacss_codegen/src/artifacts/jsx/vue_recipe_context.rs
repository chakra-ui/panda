use pandacss_config::JsxStylePropsConfig;

use super::jsx_helper::{type_import, value_import};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn recipe_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let module = Module::new()
        .with_import(value_import(
            &["computed", "defineComponent", "h", "inject", "provide"],
            "vue",
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(ImportDecl::value(["getDisplayName"], "./helper"))
        .with_import(type_import(
            &[
                "RecipeDefinition",
                "RecipeRuntimeFn",
                "RecipeSelection",
                "RecipeVariantRecord",
            ],
            "../types/recipe",
        ))
        .with_import(type_import(
            &["Assign", "JsxHTMLProps", "JsxStyleProps"],
            "../types/system",
        ))
        .with_import(type_import(
            &[
                "AsProps",
                "ComponentProps",
                "DataAttrs",
                "ElementType",
                "IntrinsicElement",
                "JsxFactoryOptions",
                "UnstyledProps",
                "VModelProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(
            &[
                "Component",
                "ComputedRef",
                "FunctionalComponent",
                "InjectionKey",
                "NativeElements",
            ],
            "vue",
        ));

    module.with_item(Item::typed_source(
        format!("{CREATE_RECIPE_CONTEXT_TYPES}\n\n{CREATE_RECIPE_CONTEXT_RUNTIME}")
            .replace("__FACTORY__", &factory),
    ))
}

pub(super) fn slot_recipe_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let css_imports = match style_props(ctx) {
        JsxStylePropsConfig::All => vec!["cx", "sva"],
        JsxStylePropsConfig::Minimal | JsxStylePropsConfig::None => vec!["cx", "css", "sva"],
    };
    let module = Module::new()
        .with_import(value_import(
            &["computed", "defineComponent", "h", "inject", "provide"],
            "vue",
        ))
        .with_import(value_import(
            &css_imports,
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(ImportDecl::value(["getDisplayName"], "./helper"))
        .with_import(type_import(
            &[
                "RecipeSelection",
                "SlotRecipeDefinition",
                "SlotRecipeRuntimeFn",
                "SlotRecipeVariantRecord",
            ],
            "../types/recipe",
        ))
        .with_import(type_import(
            &[
                "Assign",
                "JsxHTMLProps",
                "JsxStyleProps",
                "SystemStyleObject",
            ],
            "../types/system",
        ))
        .with_import(type_import(
            &[
                "AsProps",
                "ComponentProps",
                "DataAttrs",
                "ElementType",
                "IntrinsicElement",
                "JsxFactoryOptions",
                "UnstyledProps",
                "VModelProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(
            &[
                "Component",
                "ComputedRef",
                "FunctionalComponent",
                "InjectionKey",
                "NativeElements",
            ],
            "vue",
        ));

    module.with_item(Item::typed_source(format!(
        "{CREATE_SLOT_RECIPE_CONTEXT_TYPES}\n\n{}",
        create_slot_recipe_context_runtime(&factory, style_props(ctx))
    )))
}

fn create_slot_recipe_context_runtime(factory: &str, mode: JsxStylePropsConfig) -> String {
    CREATE_SLOT_RECIPE_CONTEXT_RUNTIME
        .replace("__FACTORY__", factory)
        .replace("__RESOLVE_PROPS__", slot_resolve_props(mode))
}

fn slot_resolve_props(mode: JsxStylePropsConfig) -> &'static str {
    match mode {
        JsxStylePropsConfig::All => "return { ...slotStyles as SystemStyleObject, ...restProps }",
        JsxStylePropsConfig::Minimal => {
            "return { ...restProps, css: css.raw(slotStyles as SystemStyleObject, restProps.css as SystemStyleObject) }"
        }
        JsxStylePropsConfig::None => {
            "return { ...restProps, class: cx(css(slotStyles as SystemStyleObject), restProps.class as string) }"
        }
    }
}

const CREATE_RECIPE_CONTEXT_RUNTIME: &str = r"type Props = Record<string, unknown>

function resolveRecipe(recipe: unknown): RecipeContextRecipe {
  if (recipe == null) throw new Error('createRecipeContext requires a recipe')
  if (typeof recipe === 'function') return recipe as RecipeContextRecipe
  throw new Error('createRecipeContext requires a recipe')
}

export function createRecipeContext<R extends RecipeContextRecipe>(recipeInput: R): RecipeContext<R> {
  const recipe = resolveRecipe(recipeInput)
  const PropsContext: InjectionKey<ComputedRef<Props>> = Symbol('PropsContext')
  const usePropsContext = () => inject(PropsContext)

  const PropsProvider = defineComponent({
    props: ['value'],
    setup(props, { attrs, slots }) {
      const value = computed(() => props.value ?? attrs)
      provide(PropsContext, value)
      return () => slots.default?.()
    },
  })

  const withContext = (Component: ElementType, options?: JsxFactoryOptions<Props>) => {
    const StyledComponent = __FACTORY__(Component, recipe as AnyRecipeDefinition, options)
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])

    const WithContext: Component & { displayName?: string } = defineComponent({
      inheritAttrs: false,
      setup(inProps, { attrs, slots }) {
        const propsContext = usePropsContext()
        const props = computed(() => {
          if (!propsContext) return { ...inProps, ...attrs }
          return { ...propsContext.value, ...inProps, ...attrs }
        })
        return () => h(StyledComponent as Component, props.value, slots)
      },
    })

    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withContext,
    PropsProvider,
    usePropsContext,
  } as unknown as RecipeContext<R>
}";

const CREATE_SLOT_RECIPE_CONTEXT_RUNTIME: &str = r#"type Props = Record<string, unknown>

type SlotStyles = Record<string, unknown> & { _classNameMap?: Record<string, string> }

interface SlotRecipeShape {
  splitVariantProps?: unknown
  slots?: unknown
  config?: AnySlotRecipeDefinition
  __recipe__?: unknown
  __name__?: string
}

interface SlotRecipeRuntime {
  (props?: Props): SlotStyles
  raw(props?: Props): SlotStyles
  splitVariantProps(props: Props): [Props, Props]
  variantKeys: string[]
  classNameMap?: Record<string, string>
}

interface SlotOptions {
  defaultProps?: Props
  forwardProps?: readonly string[]
}

function resolveSlotRecipe(recipe: SlotRecipeShape | null | undefined): SlotRecipeShape {
  if (recipe == null) throw new Error('createSlotRecipeContext requires a slot recipe')
  if (typeof recipe.splitVariantProps === 'function') return recipe
  if (recipe.slots) return recipe
  throw new Error('createSlotRecipeContext requires a slot recipe')
}

export function createSlotRecipeContext<R extends SlotRecipeContextInput>(recipeInput: R): SlotRecipeContext<R> {
  const recipe = resolveSlotRecipe(recipeInput as SlotRecipeShape)
  const SlotStylesContext: InjectionKey<ComputedRef<SlotStyles>> = Symbol('SlotStylesContext')
  const isRuntimeRecipe = typeof recipe.splitVariantProps === 'function'
  const isConfigRecipe = isRuntimeRecipe && recipe.__recipe__ !== undefined
  const recipeName = isRuntimeRecipe && recipe.__name__ ? recipe.__name__ : undefined
  const contextName = recipeName ? `createSlotRecipeContext("${recipeName}")` : 'createSlotRecipeContext'
  const slotRecipeFn = isRuntimeRecipe ? recipe as SlotRecipeRuntime : sva(recipe.config ?? recipe as AnySlotRecipeDefinition) as unknown as SlotRecipeRuntime

  function useSlotStylesContext(componentName: string, slot: string): ComputedRef<SlotStyles> {
    const context = inject(SlotStylesContext)
    if (context === undefined) {
      const componentInfo = componentName ? `Component "${componentName}"` : 'A component'
      const slotInfo = slot ? ` (slot: "${slot}")` : ''
      throw new Error(`${componentInfo}${slotInfo} cannot access ${contextName} because it's missing its Provider.`)
    }
    return context
  }

  const resolveProps = (props: Props, slotStyles: unknown): Props => {
    const { unstyled, ...restProps } = props
    if (unstyled) return restProps
    if (isConfigRecipe) return { ...restProps, class: cx(slotStyles as string, restProps.class as string) }
    __RESOLVE_PROPS__
  }

  const resolveSlots = (variantProps: Props) => {
    const styles = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
    if (!isConfigRecipe) styles._classNameMap = slotRecipeFn.classNameMap
    return styles
  }

  const withRootProvider = (Component: ElementType, options?: SlotOptions) => {
    const WithRootProvider: Component & { displayName?: string } = defineComponent({
      props: slotRecipeFn.variantKeys,
      setup(props, { slots }) {
        const [variantProps, otherProps] = slotRecipeFn.splitVariantProps(props)
        const resolvedSlots = computed(() => resolveSlots(variantProps))
        provide(SlotStylesContext, resolvedSlots)

        const mergedProps = computed(() => {
          if (!options?.defaultProps) return otherProps
          return { ...options.defaultProps, ...otherProps }
        })

        return () => h(Component as Component, mergedProps.value, slots)
      },
    })
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    return WithRootProvider
  }

  const withProvider = (Component: ElementType, slot: string, options?: SlotOptions) => {
    const StyledComponent = __FACTORY__(Component, {}, options as JsxFactoryOptions<Props>)
    const WithProvider: Component & { displayName?: string } = defineComponent({
      props: ['unstyled', ...slotRecipeFn.variantKeys],
      inheritAttrs: false,
      setup(inProps, { slots, attrs }) {
        const props = computed(() => {
          const propsWithClass: Props = { ...inProps, ...attrs }
          propsWithClass.class = propsWithClass.class ?? options?.defaultProps?.class
          return propsWithClass
        })
        const split = computed(() => {
          const [variantProps, restProps] = slotRecipeFn.splitVariantProps(props.value)
          return { variantProps, restProps }
        })
        const resolvedSlots = computed(() => resolveSlots(split.value.variantProps))
        provide(SlotStylesContext, resolvedSlots)

        return () => {
          const resolvedProps = resolveProps(split.value.restProps, resolvedSlots.value[slot])
          resolvedProps.class = cx(resolvedProps.class as string, resolvedSlots.value._classNameMap?.[slot])
          resolvedProps['data-slot'] = slot
          options?.forwardProps?.forEach((key) => {
            if (key in split.value.variantProps) resolvedProps[key] = split.value.variantProps[key]
          })
          return h(StyledComponent as Component, resolvedProps, slots)
        }
      },
    })
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])
    WithProvider.displayName = `withProvider(${componentName})`
    return WithProvider
  }

  const withContext = (Component: ElementType, slot: string, options?: SlotOptions) => {
    const StyledComponent = __FACTORY__(Component, {}, options as JsxFactoryOptions<Props>)
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])
    const WithContext: Component & { displayName?: string } = defineComponent({
      props: ['unstyled'],
      inheritAttrs: false,
      setup(inProps, { slots, attrs }) {
        const props = computed(() => {
          const propsWithClass: Props = { ...inProps, ...attrs }
          propsWithClass.class = propsWithClass.class ?? options?.defaultProps?.class
          return propsWithClass
        })
        const resolvedSlots = useSlotStylesContext(componentName, slot)

        return () => {
          const resolvedProps = resolveProps(props.value, resolvedSlots.value[slot])
          resolvedProps.class = cx(resolvedProps.class as string, resolvedSlots.value._classNameMap?.[slot])
          resolvedProps['data-slot'] = slot
          return h(StyledComponent as Component, resolvedProps, slots)
        }
      },
    })
    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withRootProvider,
    withProvider,
    withContext,
  } as unknown as SlotRecipeContext<R>
}"#;

const CREATE_RECIPE_CONTEXT_TYPES: &str = r"type AnyRecipeDefinition = RecipeDefinition<RecipeVariantRecord>

interface RuntimeRecipeFn {
  __type: unknown
  (props?: never): string
}

type RecipeContextRecipe = RecipeRuntimeFn<any, any> | RuntimeRecipeFn | AnyRecipeDefinition

type RecipePropsOf<R extends RecipeContextRecipe> = R extends RuntimeRecipeFn
  ? R['__type']
  : R extends RecipeRuntimeFn<infer P, any>
    ? P
    : R extends RecipeDefinition<infer T>
      ? RecipeSelection<T>
      : never

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe, F extends string = never> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & VModelProps, WithForwardedProps<Assign<RecipePropsOf<R>, JsxStyleProps>, T, F>>
>

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType, F extends string = never>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>, F> | undefined
  ) => RecipeContextComponent<T, R, F>
  PropsProvider: FunctionalComponent<Partial<RecipePropsOf<R>> & DataAttrs>
  usePropsContext: () => RecipePropsOf<R> | undefined
}";

const CREATE_SLOT_RECIPE_CONTEXT_TYPES: &str = r"type AnySlotRecipeDefinition = SlotRecipeDefinition<string, SlotRecipeVariantRecord<string>>

interface RuntimeSlotRecipeFn {
  __type: unknown
  __slot: string
  (props?: never): unknown
}

type SlotRecipeContextInput = SlotRecipeRuntimeFn<string, any, any> | RuntimeSlotRecipeFn | AnySlotRecipeDefinition

type SlotNameOf<R extends SlotRecipeContextInput> = R extends RuntimeSlotRecipeFn
  ? R['__slot']
  : R extends SlotRecipeRuntimeFn<infer S, any, any>
    ? S
    : R extends SlotRecipeDefinition<infer S, any>
      ? S
      : string

type SlotRecipePropsOf<R extends SlotRecipeContextInput> = R extends RuntimeSlotRecipeFn
  ? R['__type']
  : R extends SlotRecipeRuntimeFn<any, infer P, any>
    ? P
    : R extends SlotRecipeDefinition<any, infer T>
      ? RecipeSelection<T>
      : never

interface WithProviderOptions<P = {}> {
  defaultProps?: (Partial<P> & DataAttrs) | undefined
}

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput, F extends string = never> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & VModelProps, WithForwardedProps<Assign<SlotRecipePropsOf<R>, JsxStyleProps>, T, F>>
>

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = FunctionalComponent<
  ComponentProps<T> & UnstyledProps & VModelProps & SlotRecipePropsOf<R>
>

type SlotRecipeConsumerComponent<T extends ElementType, F extends string = never> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & VModelProps, WithForwardedProps<JsxStyleProps, T, F>>
>

export interface SlotRecipeContext<R extends SlotRecipeContextInput> {
  withRootProvider: <T extends ElementType>(
    Component: T,
    options?: WithProviderOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeRootProviderComponent<T, R>
  withProvider: <T extends ElementType, F extends string = never>(
    Component: T,
    slot: SlotNameOf<R>,
    options?: JsxFactoryOptions<ComponentProps<T>, F> | undefined
  ) => SlotRecipeProviderComponent<T, R, F>
  withContext: <T extends ElementType, F extends string = never>(
    Component: T,
    slot: SlotNameOf<R>,
    options?: JsxFactoryOptions<ComponentProps<T>, F> | undefined
  ) => SlotRecipeConsumerComponent<T, F>
}";

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}
