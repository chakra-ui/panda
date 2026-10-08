use pandacss_config::JsxStylePropsConfig;

use super::jsx_helper::{type_import, value_import};
use super::react_recipe_context::{CREATE_RECIPE_CONTEXT_RUNTIME, slot_recipe_context_runtime};
use crate::{CodegenContext, ImportDecl, Item, Module, RuntimeImport};

pub(super) fn recipe_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let module = Module::new()
        .with_import(value_import(&["createContext"], "preact"))
        .with_import(type_import(&["Provider"], "preact"))
        .with_import(value_import(&["useContext"], "preact/hooks"))
        .with_import(value_import(
            &["createElement", "forwardRef"],
            "preact/compat",
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
                "DataAttrs",
                "ElementType",
                "JsxFactoryOptions",
                "UnstyledProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(
            &["ComponentProps", "ComponentType", "JSX"],
            "preact/compat",
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
        .with_import(value_import(&["createContext"], "preact"))
        .with_import(type_import(&["Context", "Provider"], "preact"))
        .with_import(value_import(&["useContext"], "preact/hooks"))
        .with_import(value_import(
            &["createElement", "forwardRef"],
            "preact/compat",
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
                "DataAttrs",
                "ElementType",
                "JsxFactoryOptions",
                "UnstyledProps",
                "WithForwardedProps",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(
            &["ComponentProps", "ComponentType", "JSX"],
            "preact/compat",
        ));

    module.with_item(Item::typed_source(format!(
        "{CREATE_SLOT_RECIPE_CONTEXT_TYPES}\n\n{}",
        slot_recipe_context_runtime(&factory, style_props(ctx))
    )))
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

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe, F extends string = never> = ComponentType<
  RecipeContextComponentProps<T, R, F>
>

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType, F extends string = never>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>, F> | undefined
  ) => RecipeContextComponent<T, R, F>
  PropsProvider: Provider<Partial<RecipePropsOf<R>> & DataAttrs>
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

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput, F extends string = never> = ComponentType<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, WithForwardedProps<Assign<SlotRecipePropsOf<R>, JsxStyleProps>, T, F>>
>

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = ComponentType<
  ComponentProps<T> & UnstyledProps & SlotRecipePropsOf<R>
>

type SlotRecipeConsumerComponent<T extends ElementType, F extends string = never> = ComponentType<
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
  PropsProvider: Provider<Partial<SlotRecipePropsOf<R>> & DataAttrs>
  usePropsContext: () => SlotRecipePropsOf<R> | undefined
}";

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}
