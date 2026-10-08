use pandacss_config::JsxStylePropsConfig;

use super::jsx_helper::{type_import, value_import};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn recipe_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let module = Module::new()
        .with_directive("use client")
        .with_import(value_import(
            &["createContext", "useContext", "createElement", "forwardRef"],
            "react",
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(ImportDecl::value(
            ["getDisplayName", "mergeDefaultProps"],
            "./helper",
        ))
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
                "JsxFactoryOptions",
                "UnstyledProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(&["ElementType", "JSX", "Provider"], "react"));

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
        .with_directive("use client")
        .with_import(value_import(
            &["createContext", "useContext", "createElement", "forwardRef"],
            "react",
        ))
        .with_import(value_import(
            &css_imports,
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(ImportDecl::value(
            ["getDisplayName", "mergeDefaultProps"],
            "./helper",
        ))
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
                "JsxFactoryOptions",
                "UnstyledProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(&["Context", "ElementType", "JSX"], "react"));

    module.with_item(Item::typed_source(create_slot_recipe_context_source(
        &factory,
        style_props(ctx),
    )))
}

fn create_slot_recipe_context_source(factory: &str, mode: JsxStylePropsConfig) -> String {
    format!(
        "{CREATE_SLOT_RECIPE_CONTEXT_TYPES}\n\n{}",
        slot_recipe_context_runtime(factory, mode)
    )
}

/// The slot context runtime for `factory` and the style-props mode, shared with Preact.
pub(super) fn slot_recipe_context_runtime(factory: &str, mode: JsxStylePropsConfig) -> String {
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
            "return { ...restProps, className: cx(css(slotStyles as SystemStyleObject), restProps.className as string) }"
        }
    }
}

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}

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

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe, F extends string = never> = (
  props: RecipeContextComponentProps<T, R, F>
) => JSX.Element

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType, F extends string = never>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>, F> | undefined
  ) => RecipeContextComponent<T, R, F>
  PropsProvider: Provider<Partial<RecipePropsOf<R>> & DataAttrs>
  usePropsContext: () => RecipePropsOf<R> | undefined
}";

/// Typed runtime, shared with Preact.
pub(super) const CREATE_RECIPE_CONTEXT_RUNTIME: &str = r"type RecipeShape = Partial<Record<'__recipe__' | '__cva__' | 'base' | 'variants' | 'defaultVariants' | 'compoundVariants', unknown>>

type Props = Record<string, unknown>

function resolveRecipe(recipe: RecipeShape | null | undefined): RecipeShape {
  if (recipe == null) throw new Error('createRecipeContext requires a recipe')
  if (recipe.__recipe__ === true || recipe.__cva__ === true) return recipe
  if (recipe.base || recipe.variants || recipe.defaultVariants || recipe.compoundVariants) return recipe
  throw new Error('createRecipeContext requires a recipe')
}

export function createRecipeContext<R extends RecipeContextRecipe>(recipeInput: R): RecipeContext<R> {
  const recipe = resolveRecipe(recipeInput as RecipeShape)
  const PropsContext = createContext<Props | undefined>(undefined)
  const usePropsContext = () => useContext(PropsContext)

  const withContext = <T extends ElementType, F extends string = never>(Component: T, options?: JsxFactoryOptions<ComponentProps<T>, F>): RecipeContextComponent<T, R, F> => {
    const StyledComponent = __FACTORY__(Component as ElementType, recipe as AnyRecipeDefinition, options as JsxFactoryOptions<Props>)
    const componentName = getDisplayName(Component)

    const WithContext = forwardRef<unknown, Props>(function WithContext(inProps, ref) {
      const propsContext = usePropsContext()
      const props = propsContext ? mergeDefaultProps(propsContext, inProps) : inProps
      return createElement(StyledComponent as ElementType, { ...props, ref })
    })

    WithContext.displayName = `withContext(${componentName})`
    return WithContext as unknown as RecipeContextComponent<T, R, F>
  }

  return {
    withContext,
    PropsProvider: PropsContext.Provider,
    usePropsContext,
  } as unknown as RecipeContext<R>
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

type SlotRecipeProviderProps<T extends ElementType, R extends SlotRecipeContextInput, F extends string> = JsxHTMLProps<
  ComponentProps<T> & UnstyledProps & AsProps,
  WithForwardedProps<Assign<SlotRecipePropsOf<R>, JsxStyleProps>, T, F>
>

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput, F extends string = never> = (
  props: SlotRecipeProviderProps<T, R, F>
) => JSX.Element

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = (
  props: ComponentProps<T> & UnstyledProps & SlotRecipePropsOf<R>
) => JSX.Element

type SlotRecipeConsumerComponent<T extends ElementType, F extends string = never> = (
  props: JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, WithForwardedProps<JsxStyleProps, T, F>>
) => JSX.Element

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

/// Typed runtime, shared with Preact.
pub(super) const CREATE_SLOT_RECIPE_CONTEXT_RUNTIME: &str = r#"type Props = Record<string, unknown>

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
  defaultProps?: Props
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
    if (isConfigRecipe) return { ...restProps, className: cx(slotStyles as string, restProps.className as string) }
    __RESOLVE_PROPS__
  }

  const resolveSlots = (variantProps: Props) => {
    const styles = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
    if (!isConfigRecipe) styles._classNameMap = slotRecipeFn.classNameMap
    return styles
  }

  const withRootProvider = (Component: ElementType, options?: SlotOptions) => {
    const WithRootProvider = (props: Props) => {
      const [variantProps, otherProps] = slotRecipeFn.splitVariantProps(props)
      const resolvedSlots = resolveSlots(variantProps)
      const mergedProps = options?.defaultProps ? mergeDefaultProps(options.defaultProps, otherProps) : otherProps
      return createElement(SlotStylesContext.Provider, {
        value: resolvedSlots,
        children: createElement(Component, mergedProps),
      })
    }
    const componentName = getDisplayName(Component)
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    return WithRootProvider
  }

  const withProvider = (Component: ElementType, slot: string, options?: SlotOptions) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const WithProvider = forwardRef<unknown, Props>(function WithProvider(props, ref) {
      const [variantProps, restProps] = slotRecipeFn.splitVariantProps(props)
      const resolvedSlots = resolveSlots(variantProps)
      if (restProps.className == null && options?.defaultProps?.className) restProps.className = options.defaultProps.className
      const resolvedProps = resolveProps(restProps, resolvedSlots[slot])
      options?.forwardProps?.forEach((key) => {
        if (key in variantProps) resolvedProps[key] = variantProps[key]
      })
      return createElement(SlotStylesContext.Provider, {
        value: resolvedSlots,
        children: createElement(StyledComponent as ElementType, {
          ...resolvedProps,
          className: cx(resolvedProps.className as string, resolvedSlots._classNameMap?.[slot]),
          'data-slot': slot,
          ref,
        }),
      })
    })
    const componentName = getDisplayName(Component)
    WithProvider.displayName = `withProvider(${componentName})`
    return WithProvider
  }

  const withContext = (Component: ElementType, slot: string, options?: SlotOptions) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const componentName = getDisplayName(Component)
    const WithContext = forwardRef<unknown, Props>(function WithContext(props, ref) {
      const resolvedSlots = useSlotStylesContext(componentName, slot)
      const nextProps = props.className == null && options?.defaultProps?.className
        ? { ...props, className: options.defaultProps.className }
        : props
      const resolvedProps = resolveProps(nextProps, resolvedSlots[slot])
      return createElement(StyledComponent as ElementType, {
        ...resolvedProps,
        className: cx(resolvedProps.className as string, resolvedSlots._classNameMap?.[slot]),
        'data-slot': slot,
        ref,
      })
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
