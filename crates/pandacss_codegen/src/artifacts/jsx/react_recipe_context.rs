use pandacss_config::JsxStylePropsConfig;

use crate::{CodegenContext, ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn recipe_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let module = Module::new()
        .with_directive("use client")
        .with_import(value_import(
            &["createContext", "useContext", "createElement", "forwardRef"],
            "react",
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
                "JsxFactoryOptions",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(&["ElementType", "JSX", "Provider"], "react"));

    module
        .with_item(raw_runtime(create_recipe_context_runtime(&factory)))
        .with_item(raw_type(CREATE_RECIPE_CONTEXT_TYPES))
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
        .with_import(value_import(&css_imports, "../css/index"))
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
            &["Assign", "JsxHTMLProps", "JsxStyleProps"],
            "../types/system",
        ))
        .with_import(type_import(
            &[
                "AsProps",
                "ComponentProps",
                "DataAttrs",
                "JsxFactoryOptions",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(&["ElementType", "JSX"], "react"));

    module
        .with_item(raw_runtime(create_slot_recipe_context_runtime(
            &factory,
            style_props(ctx),
        )))
        .with_item(raw_type(CREATE_SLOT_RECIPE_CONTEXT_TYPES))
}

fn create_recipe_context_runtime(factory: &str) -> String {
    CREATE_RECIPE_CONTEXT_RUNTIME.replace("__FACTORY__", factory)
}

fn create_slot_recipe_context_runtime(factory: &str, mode: JsxStylePropsConfig) -> String {
    CREATE_SLOT_RECIPE_CONTEXT_RUNTIME
        .replace("__FACTORY__", factory)
        .replace("__RESOLVE_PROPS__", slot_resolve_props(mode))
}

fn slot_resolve_props(mode: JsxStylePropsConfig) -> &'static str {
    match mode {
        JsxStylePropsConfig::All => "return { ...slotStyles, ...restProps }",
        JsxStylePropsConfig::Minimal => {
            "return { ...restProps, css: css.raw(slotStyles, restProps.css) }"
        }
        JsxStylePropsConfig::None => {
            "return { ...restProps, className: cx(css(slotStyles), restProps.className) }"
        }
    }
}

const CREATE_RECIPE_CONTEXT_RUNTIME: &str = r"function resolveRecipe(recipe) {
  if (recipe == null) throw new Error('createRecipeContext requires a recipe')
  if (recipe.__recipe__ === true || recipe.__cva__ === true) return recipe
  if (recipe.base || recipe.variants || recipe.defaultVariants || recipe.compoundVariants) return recipe
  throw new Error('createRecipeContext requires a recipe')
}

export function createRecipeContext(recipeInput) {
  const recipe = resolveRecipe(recipeInput)
  const PropsContext = createContext(undefined)
  const usePropsContext = () => useContext(PropsContext)

  const withContext = (Component, options) => {
    const StyledComponent = __FACTORY__(Component, recipe, options)
    const componentName = getDisplayName(Component)

    const WithContext = forwardRef(function WithContext(inProps, ref) {
      const propsContext = usePropsContext()
      const props = propsContext ? Object.assign({}, propsContext, inProps) : inProps
      return createElement(StyledComponent, { ...props, ref })
    })

    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withContext,
    PropsProvider: PropsContext.Provider,
    usePropsContext,
  }
}";

const CREATE_SLOT_RECIPE_CONTEXT_RUNTIME: &str = r#"function createSafeContext(contextName) {
  const Context = createContext(undefined)
  const useStyleContext = (componentName, slot) => {
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

function resolveSlotRecipe(recipe) {
  if (recipe == null) throw new Error('createSlotRecipeContext requires a slot recipe')
  if (typeof recipe.splitVariantProps === 'function') return recipe
  if (recipe.slots) return recipe
  throw new Error('createSlotRecipeContext requires a slot recipe')
}

export function createSlotRecipeContext(recipeInput) {
  const recipe = resolveSlotRecipe(recipeInput)
  const isRuntimeRecipe = typeof recipe.splitVariantProps === 'function'
  const isConfigRecipe = isRuntimeRecipe && recipe.__recipe__ !== undefined
  const recipeName = isRuntimeRecipe && recipe.__name__ ? recipe.__name__ : undefined
  const contextName = recipeName ? `createSlotRecipeContext("${recipeName}")` : 'createSlotRecipeContext'
  const [SlotStylesContext, useSlotStylesContext] = createSafeContext(contextName)
  const slotRecipeFn = isRuntimeRecipe ? recipe : sva(recipe.config ?? recipe)

  const resolveProps = (props, slotStyles) => {
    const { unstyled, ...restProps } = props
    if (unstyled) return restProps
    if (isConfigRecipe) return { ...restProps, className: cx(slotStyles, restProps.className) }
    __RESOLVE_PROPS__
  }

  const withRootProvider = (Component, options) => {
    const WithRootProvider = (props) => {
      const [variantProps, otherProps] = slotRecipeFn.splitVariantProps(props)
      const resolvedSlots = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
      const mergedProps = options?.defaultProps ? Object.assign({}, options.defaultProps, otherProps) : otherProps
      return createElement(SlotStylesContext.Provider, {
        value: resolvedSlots,
        children: createElement(Component, mergedProps),
      })
    }
    const componentName = getDisplayName(Component)
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    return WithRootProvider
  }

  const withProvider = (Component, slot, options) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const WithProvider = forwardRef(function WithProvider(props, ref) {
      const [variantProps, restProps] = slotRecipeFn.splitVariantProps(props)
      const resolvedSlots = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
      if (restProps.className == null && options?.defaultProps?.className) restProps.className = options.defaultProps.className
      const resolvedProps = resolveProps(restProps, resolvedSlots[slot])
      options?.forwardProps?.forEach((key) => {
        if (key in variantProps) resolvedProps[key] = variantProps[key]
      })
      return createElement(SlotStylesContext.Provider, {
        value: resolvedSlots,
        children: createElement(StyledComponent, {
          ...resolvedProps,
          'data-slot': slot,
          ref,
        }),
      })
    })
    const componentName = getDisplayName(Component)
    WithProvider.displayName = `withProvider(${componentName})`
    return WithProvider
  }

  const withContext = (Component, slot, options) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const componentName = getDisplayName(Component)
    const WithContext = forwardRef(function WithContext(props, ref) {
      const resolvedSlots = useSlotStylesContext(componentName, slot)
      const nextProps = props.className == null && options?.defaultProps?.className
        ? { ...props, className: options.defaultProps.className }
        : props
      const resolvedProps = resolveProps(nextProps, resolvedSlots[slot])
      return createElement(StyledComponent, {
        ...resolvedProps,
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
  }
}"#;

const CREATE_RECIPE_CONTEXT_TYPES: &str = r"interface UnstyledProps {
  unstyled?: boolean | undefined
}

type AnyRecipeDefinition = RecipeDefinition<RecipeVariantRecord>

interface RuntimeRecipeFn {
  __type: any
  (props?: any): string
}

type RecipeContextRecipe = RecipeRuntimeFn<any, any> | RuntimeRecipeFn | AnyRecipeDefinition

type RecipePropsOf<R extends RecipeContextRecipe> = R extends RuntimeRecipeFn
  ? R['__type']
  : R extends RecipeRuntimeFn<infer P, any>
    ? P
    : R extends RecipeDefinition<infer T>
      ? RecipeSelection<T>
      : never

type RecipeContextComponentProps<T extends ElementType, R extends RecipeContextRecipe> = JsxHTMLProps<
  ComponentProps<T> & UnstyledProps & AsProps & DataAttrs,
  Assign<RecipePropsOf<R>, JsxStyleProps>
>

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe> = (
  props: RecipeContextComponentProps<T, R>
) => JSX.Element

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => RecipeContextComponent<T, R>
  PropsProvider: Provider<Partial<RecipePropsOf<R>> & DataAttrs>
  usePropsContext: () => RecipePropsOf<R> | undefined
}

export declare function createRecipeContext<R extends RecipeContextRecipe>(recipe: R): RecipeContext<R>";

const CREATE_SLOT_RECIPE_CONTEXT_TYPES: &str = r"interface UnstyledProps {
  unstyled?: boolean | undefined
}

type AnySlotRecipeDefinition = SlotRecipeDefinition<string, SlotRecipeVariantRecord<string>>

interface RuntimeSlotRecipeFn {
  __type: any
  __slot: string
  (props?: any): any
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

type SlotRecipeProviderProps<T extends ElementType, R extends SlotRecipeContextInput> = JsxHTMLProps<
  ComponentProps<T> & UnstyledProps & AsProps & DataAttrs,
  Assign<SlotRecipePropsOf<R>, JsxStyleProps>
>

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = (
  props: SlotRecipeProviderProps<T, R>
) => JSX.Element

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = (
  props: ComponentProps<T> & UnstyledProps & DataAttrs & SlotRecipePropsOf<R>
) => JSX.Element

type SlotRecipeConsumerComponent<T extends ElementType> = (
  props: JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & DataAttrs, JsxStyleProps>
) => JSX.Element

export interface SlotRecipeContext<R extends SlotRecipeContextInput> {
  withRootProvider: <T extends ElementType>(
    Component: T,
    options?: WithProviderOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeRootProviderComponent<T, R>
  withProvider: <T extends ElementType>(
    Component: T,
    slot: SlotNameOf<R>,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeProviderComponent<T, R>
  withContext: <T extends ElementType>(
    Component: T,
    slot: SlotNameOf<R>,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeConsumerComponent<T>
}

export declare function createSlotRecipeContext<R extends SlotRecipeContextInput>(recipe: R): SlotRecipeContext<R>";

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}

fn value_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Value,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

fn type_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Type,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

fn raw_runtime(code: impl Into<String>) -> Item {
    Item::runtime(ItemNode::RawStmt(code.into()))
}

fn raw_type(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}
