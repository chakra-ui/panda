use pandacss_config::JsxStylePropsConfig;

use crate::{CodegenContext, ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

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
            &["AsProps", "DataAttrs", "JsxFactoryOptions"],
            "../types/jsx",
        ))
        .with_import(type_import(
            &["Component", "FunctionalComponent", "NativeElements"],
            "vue",
        ));

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
        .with_import(value_import(
            &["computed", "defineComponent", "h", "inject", "provide"],
            "vue",
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
            &["AsProps", "DataAttrs", "JsxFactoryOptions"],
            "../types/jsx",
        ))
        .with_import(type_import(
            &["Component", "FunctionalComponent", "NativeElements"],
            "vue",
        ));

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
            "return { ...restProps, class: cx(css(slotStyles), restProps.class) }"
        }
    }
}

const CREATE_RECIPE_CONTEXT_RUNTIME: &str = r"function resolveRecipe(recipe) {
  if (recipe == null) throw new Error('createRecipeContext requires a recipe')
  if (typeof recipe === 'function') return recipe
  throw new Error('createRecipeContext requires a recipe')
}

export function createRecipeContext(recipeInput) {
  const recipe = resolveRecipe(recipeInput)
  const PropsContext = Symbol('PropsContext')
  const usePropsContext = () => inject(PropsContext)

  const PropsProvider = defineComponent({
    props: ['value'],
    setup(props, { attrs, slots }) {
      const value = computed(() => props.value ?? attrs)
      provide(PropsContext, value)
      return () => slots.default?.()
    },
  })

  const withContext = (Component, options) => {
    const StyledComponent = __FACTORY__(Component, recipe, options)
    const componentName = getDisplayName(Component)

    const WithContext = defineComponent({
      inheritAttrs: false,
      setup(inProps, { attrs, slots }) {
        const propsContext = usePropsContext()
        const props = computed(() => {
          if (!propsContext) return { ...inProps, ...attrs }
          return { ...propsContext.value, ...inProps, ...attrs }
        })
        return () => h(StyledComponent, props.value, slots)
      },
    })

    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withContext,
    PropsProvider,
    usePropsContext,
  }
}";

const CREATE_SLOT_RECIPE_CONTEXT_RUNTIME: &str = r#"function resolveSlotRecipe(recipe) {
  if (recipe == null) throw new Error('createSlotRecipeContext requires a slot recipe')
  if (typeof recipe.splitVariantProps === 'function') return recipe
  if (recipe.slots) return recipe
  throw new Error('createSlotRecipeContext requires a slot recipe')
}

export function createSlotRecipeContext(recipeInput) {
  const recipe = resolveSlotRecipe(recipeInput)
  const SlotStylesContext = Symbol('SlotStylesContext')
  const isRuntimeRecipe = typeof recipe.splitVariantProps === 'function'
  const isConfigRecipe = isRuntimeRecipe && recipe.__recipe__ !== undefined
  const recipeName = isRuntimeRecipe && recipe.__name__ ? recipe.__name__ : undefined
  const contextName = recipeName ? `createSlotRecipeContext("${recipeName}")` : 'createSlotRecipeContext'
  const slotRecipeFn = isRuntimeRecipe ? recipe : sva(recipe.config ?? recipe)

  function useSlotStylesContext(componentName, slot) {
    const context = inject(SlotStylesContext)
    if (context === undefined) {
      const componentInfo = componentName ? `Component "${componentName}"` : 'A component'
      const slotInfo = slot ? ` (slot: "${slot}")` : ''
      throw new Error(`${componentInfo}${slotInfo} cannot access ${contextName} because it's missing its Provider.`)
    }
    return context
  }

  const resolveProps = (props, slotStyles) => {
    const { unstyled, ...restProps } = props
    if (unstyled) return restProps
    if (isConfigRecipe) return { ...restProps, class: cx(slotStyles, restProps.class) }
    __RESOLVE_PROPS__
  }

  const withRootProvider = (Component, options) => {
    const WithRootProvider = defineComponent({
      props: slotRecipeFn.variantKeys,
      setup(props, { slots }) {
        const [variantProps, otherProps] = slotRecipeFn.splitVariantProps(props)
        const resolvedSlots = computed(() => {
          const styles = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
          return styles
        })
        provide(SlotStylesContext, resolvedSlots)

        const mergedProps = computed(() => {
          if (!options?.defaultProps) return otherProps
          return { ...options.defaultProps, ...otherProps }
        })

        return () => h(Component, mergedProps.value, slots)
      },
    })
    const componentName = getDisplayName(Component)
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    return WithRootProvider
  }

  const withProvider = (Component, slot, options) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const WithProvider = defineComponent({
      props: ['unstyled', ...slotRecipeFn.variantKeys],
      inheritAttrs: false,
      setup(inProps, { slots, attrs }) {
        const props = computed(() => {
          const propsWithClass = { ...inProps, ...attrs }
          propsWithClass.class = propsWithClass.class ?? options?.defaultProps?.class
          return propsWithClass
        })
        const split = computed(() => {
          const [variantProps, restProps] = slotRecipeFn.splitVariantProps(props.value)
          return { variantProps, restProps }
        })
        const resolvedSlots = computed(() => {
          const styles = isConfigRecipe ? slotRecipeFn(split.value.variantProps) : slotRecipeFn.raw(split.value.variantProps)
          return styles
        })
        provide(SlotStylesContext, resolvedSlots)

        return () => {
          const resolvedProps = resolveProps(split.value.restProps, resolvedSlots.value[slot])
          resolvedProps['data-slot'] = slot
          return h(StyledComponent, resolvedProps, slots)
        }
      },
    })
    const componentName = getDisplayName(Component)
    WithProvider.displayName = `withProvider(${componentName})`
    return WithProvider
  }

  const withContext = (Component, slot, options) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const componentName = getDisplayName(Component)
    const WithContext = defineComponent({
      props: ['unstyled'],
      inheritAttrs: false,
      setup(inProps, { slots, attrs }) {
        const props = computed(() => {
          const propsWithClass = { ...inProps, ...attrs }
          propsWithClass.class = propsWithClass.class ?? options?.defaultProps?.class
          return propsWithClass
        })
        const resolvedSlots = useSlotStylesContext(componentName, slot)

        return () => {
          const resolvedProps = resolveProps(props.value, resolvedSlots.value[slot])
          resolvedProps['data-slot'] = slot
          return h(StyledComponent, resolvedProps, slots)
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
  }
}"#;

const CREATE_RECIPE_CONTEXT_TYPES: &str = r"interface UnstyledProps {
  unstyled?: boolean | undefined
}

interface VModelProps {
  modelValue?: any
  'onUpdate:modelValue'?: (value: any) => void
}

type IntrinsicElement = keyof NativeElements
type ElementType = IntrinsicElement | Component
type ComponentProps<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
    ? Props
    : never

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

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & VModelProps & DataAttrs, Assign<RecipePropsOf<R>, JsxStyleProps>>
>

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => RecipeContextComponent<T, R>
  PropsProvider: FunctionalComponent<Partial<RecipePropsOf<R>> & DataAttrs>
  usePropsContext: () => RecipePropsOf<R> | undefined
}

export declare function createRecipeContext<R extends RecipeContextRecipe>(recipe: R): RecipeContext<R>";

const CREATE_SLOT_RECIPE_CONTEXT_TYPES: &str = r"interface UnstyledProps {
  unstyled?: boolean | undefined
}

interface VModelProps {
  modelValue?: any
  'onUpdate:modelValue'?: (value: any) => void
}

type IntrinsicElement = keyof NativeElements
type ElementType = IntrinsicElement | Component
type ComponentProps<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
    ? Props
    : never

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

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & VModelProps & DataAttrs, Assign<SlotRecipePropsOf<R>, JsxStyleProps>>
>

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = FunctionalComponent<
  ComponentProps<T> & UnstyledProps & VModelProps & DataAttrs & SlotRecipePropsOf<R>
>

type SlotRecipeConsumerComponent<T extends ElementType> = FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & VModelProps & DataAttrs, JsxStyleProps>
>

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
