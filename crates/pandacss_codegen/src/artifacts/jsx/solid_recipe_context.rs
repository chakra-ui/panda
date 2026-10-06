use pandacss_config::JsxStylePropsConfig;

use super::jsx_helper::{type_import, value_import};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn recipe_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let module = Module::new()
        .with_import(value_import(
            &["createComponent", "mergeProps"],
            "solid-js/web",
        ))
        .with_import(value_import(&["createContext", "useContext"], "solid-js"))
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
                "DataAttrs",
                "ElementType",
                "JsxFactoryOptions",
                "UnstyledProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(
            &["Component", "ComponentProps", "JSX"],
            "solid-js",
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
            &["createComponent", "mergeProps"],
            "solid-js/web",
        ))
        .with_import(value_import(
            &["createContext", "createMemo", "splitProps", "useContext"],
            "solid-js",
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
                "DataAttrs",
                "ElementType",
                "JsxFactoryOptions",
                "MaybeAccessor",
                "UnstyledProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(
            &["Accessor", "Component", "ComponentProps", "Context", "JSX"],
            "solid-js",
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
  const PropsContext = createContext<Props | undefined>(undefined)
  const usePropsContext = () => useContext(PropsContext)

  const withContext = (Component: ElementType, options?: JsxFactoryOptions<Props>) => {
    const StyledComponent = __FACTORY__(Component, recipe as AnyRecipeDefinition, options)
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])

    const WithContext = (inProps: Props) => {
      const propsContext = usePropsContext()
      const props = propsContext ? mergeProps(propsContext, inProps) : inProps
      return createComponent(StyledComponent as Component<Props>, props)
    }

    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withContext,
    PropsProvider: PropsContext.Provider,
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
  classNameMap?: Record<string, string>
}

interface SlotOptions {
  defaultProps?: Props | (() => Props)
  forwardProps?: readonly string[]
}

function createSafeContext(contextName: string): [Context<SlotStyles | undefined>, (componentName: string, slot: string) => SlotStyles] {
  const Context = createContext<SlotStyles | undefined>(undefined)
  const useStyleContext = (componentName: string, slot: string) => {
    const context = useContext(Context)
    if (context === undefined) {
      const componentInfo = componentName ? `Component "${componentName}"` : 'A component'
      const slotInfo = slot ? ` (slot: "${slot}")` : ''
      throw new Error(`${componentInfo}${slotInfo} cannot access ${contextName} because it's missing its Provider.`)
    }
    return context
  }
  return [Context, useStyleContext]
}

function resolveSlotRecipe(recipe: SlotRecipeShape | null | undefined): SlotRecipeShape {
  if (recipe == null) throw new Error('createSlotRecipeContext requires a slot recipe')
  if (typeof recipe.splitVariantProps === 'function') return recipe
  if (recipe.slots) return recipe
  throw new Error('createSlotRecipeContext requires a slot recipe')
}

export function createSlotRecipeContext<R extends SlotRecipeContextInput>(recipeInput: R): SlotRecipeContext<R> {
  const recipe = resolveSlotRecipe(recipeInput as SlotRecipeShape)
  const isRuntimeRecipe = typeof recipe.splitVariantProps === 'function'
  const isConfigRecipe = isRuntimeRecipe && recipe.__recipe__ !== undefined
  const recipeName = isRuntimeRecipe && recipe.__name__ ? recipe.__name__ : undefined
  const contextName = recipeName ? `createSlotRecipeContext("${recipeName}")` : 'createSlotRecipeContext'
  const [SlotStylesContext, useSlotStylesContext] = createSafeContext(contextName)
  const slotRecipeFn = isRuntimeRecipe ? recipe as SlotRecipeRuntime : sva(recipe.config ?? recipe as AnySlotRecipeDefinition) as unknown as SlotRecipeRuntime

  const resolveProps = (props: Props, slotStyles: unknown): Props => {
    const { unstyled, ...restProps } = props
    if (unstyled) return restProps
    if (isConfigRecipe) return { ...restProps, class: cx(slotStyles as string, restProps.class as string) }
    __RESOLVE_PROPS__
  }

  const createDefaultProps = (options?: SlotOptions): Accessor<Props | undefined> => {
    const defaults = options?.defaultProps
    return typeof defaults === 'function' ? createMemo(defaults) : () => defaults
  }

  const resolveSlots = (variantProps: Props) => {
    const styles = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
    if (!isConfigRecipe) styles._classNameMap = slotRecipeFn.classNameMap
    return styles
  }

  const withRootProvider = (Component: ElementType, options?: SlotOptions) => {
    const WithRootProvider = (props: Props) => {
      const [variantProps, otherProps] = slotRecipeFn.splitVariantProps(props)
      const [local, propsWithoutChildren]: [Props, Props] = splitProps(otherProps, ['children'])

      const resolvedSlots = createMemo(() => {
        return resolveSlots(variantProps)
      })
      const defaultProps = createDefaultProps(options)

      const mergedProps = createMemo(() => {
        const defaults = defaultProps()
        if (!defaults) return propsWithoutChildren
        return { ...defaults, ...propsWithoutChildren }
      })

      return createComponent(SlotStylesContext.Provider, {
        get value() {
          return resolvedSlots()
        },
        get children() {
          return createComponent(
            Component as Component<Props>,
            mergeProps(mergedProps, {
              get children() {
                return local.children ?? defaultProps()?.children
              },
            }),
          )
        },
      })
    }
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    return WithRootProvider
  }

  const withProvider = (Component: ElementType, slot: string, options?: SlotOptions) => {
    const StyledComponent = __FACTORY__(Component, {}, options as JsxFactoryOptions<Props>)
    const WithProvider = (props: Props) => {
      const [variantProps, restProps] = slotRecipeFn.splitVariantProps(props)
      const [local, propsWithoutChildren]: [Props, Props] = splitProps(restProps, ['children'])

      const forwardedProps: Props = {}
      options?.forwardProps?.forEach((key) => {
        if (key in variantProps) {
          Object.defineProperty(forwardedProps, key, { get: () => variantProps[key], enumerable: true })
        }
      })

      const resolvedSlots = createMemo(() => {
        return resolveSlots(variantProps)
      })
      const defaultProps = createDefaultProps(options)

      const resolvedProps = createMemo(() => {
        const defaults = defaultProps()
        const propsWithClass = defaults ? { ...defaults, ...propsWithoutChildren } : propsWithoutChildren
        const slots = resolvedSlots()
        const resolved = resolveProps(propsWithClass, slots[slot])
        resolved.class = cx(resolved.class as string, slots._classNameMap?.[slot])
        resolved['data-slot'] = slot
        return resolved
      })

      return createComponent(SlotStylesContext.Provider, {
        get value() {
          return resolvedSlots()
        },
        get children() {
          return createComponent(
            StyledComponent as Component<Props>,
            mergeProps(resolvedProps, forwardedProps, {
              get children() {
                return local.children ?? defaultProps()?.children
              },
            }),
          )
        },
      })
    }
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])
    WithProvider.displayName = `withProvider(${componentName})`
    return WithProvider
  }

  const withContext = (Component: ElementType, slot: string, options?: SlotOptions) => {
    const StyledComponent = __FACTORY__(Component, {}, options as JsxFactoryOptions<Props>)
    const componentName = getDisplayName(Component as Parameters<typeof getDisplayName>[0])
    const WithContext = (props: Props) => {
      const resolvedSlots = useSlotStylesContext(componentName, slot)
      const [local, propsWithoutChildren]: [Props, Props] = splitProps(props, ['children'])
      const defaultProps = createDefaultProps(options)

      const resolvedProps = createMemo(() => {
        const defaults = defaultProps()
        const propsWithClass = defaults ? { ...defaults, ...propsWithoutChildren } : propsWithoutChildren
        const resolved = resolveProps(propsWithClass, resolvedSlots[slot])
        resolved.class = cx(resolved.class as string, resolvedSlots._classNameMap?.[slot])
        resolved['data-slot'] = slot
        return resolved
      })

      return createComponent(
        StyledComponent as Component<Props>,
        mergeProps(resolvedProps, {
          get children() {
            return local.children ?? defaultProps()?.children
          },
        }),
      )
    }
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

type RecipeContextComponentProps<T extends ElementType, R extends RecipeContextRecipe, F extends string> = JsxHTMLProps<
  ComponentProps<T> & UnstyledProps & AsProps,
  WithForwardedProps<Assign<RecipePropsOf<R>, JsxStyleProps>, T, F>
>

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe, F extends string = never> = Component<
  RecipeContextComponentProps<T, R, F>
>

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType, F extends string = never>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>, F> | undefined
  ) => RecipeContextComponent<T, R, F>
  PropsProvider: Component<Partial<RecipePropsOf<R>> & DataAttrs>
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

interface WithProviderOptions<P> {
  defaultProps?: MaybeAccessor<Partial<P> & DataAttrs> | undefined
}

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput, F extends string = never> = Component<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, WithForwardedProps<Assign<SlotRecipePropsOf<R>, JsxStyleProps>, T, F>>
>

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = Component<
  ComponentProps<T> & UnstyledProps & SlotRecipePropsOf<R>
>

type SlotRecipeConsumerComponent<T extends ElementType, F extends string = never> = Component<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, WithForwardedProps<JsxStyleProps, T, F>>
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
