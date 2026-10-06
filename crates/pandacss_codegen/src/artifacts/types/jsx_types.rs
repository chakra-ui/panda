use pandacss_shared::pascal_case;

use crate::artifacts::ts_string::type_raw;
use crate::{CodegenContext, ImportDecl, Module};
use pandacss_config::JsxFramework;

pub(super) fn module(ctx: CodegenContext<'_>) -> Module {
    let factory_name = ctx.jsx_factory().to_owned();
    let upper_name = pascal_case(&factory_name);
    let component_name = format!("{upper_name}Component");
    let html_props_name = format!("HTML{upper_name}Props");

    object_literal_module(ctx, &component_name, &upper_name, &html_props_name)
}

fn object_literal_module(
    ctx: CodegenContext<'_>,
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> Module {
    match ctx.config.jsx_framework.as_ref() {
        Some(JsxFramework::Preact) => Module::new()
            .with_import(ImportDecl::ty(["ComponentProps", "JSX"], "preact"))
            .with_import(ImportDecl::ty(
                ["RecipeDefinition", "RecipeSelection", "RecipeVariantRecord"],
                "./recipe",
            ))
            .with_import(ImportDecl::ty(
                [
                    "Assign",
                    "DistributiveUnion",
                    "JsxHTMLProps",
                    "JsxStyleProps",
                    "Pretty",
                ],
                "./system",
            ))
            .with_item(type_raw(preact_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        Some(JsxFramework::Solid) => Module::new()
            .with_import(ImportDecl::ty(
                ["Accessor", "Component", "ComponentProps", "JSX"],
                "solid-js",
            ))
            .with_import(ImportDecl::ty(
                ["RecipeDefinition", "RecipeSelection", "RecipeVariantRecord"],
                "./recipe",
            ))
            .with_import(ImportDecl::ty(
                [
                    "Assign",
                    "DistributiveUnion",
                    "JsxHTMLProps",
                    "JsxStyleProps",
                    "Pretty",
                ],
                "./system",
            ))
            .with_item(type_raw(solid_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        Some(JsxFramework::Vue) => Module::new()
            .with_import(ImportDecl::ty(
                ["Component", "FunctionalComponent", "NativeElements"],
                "vue",
            ))
            .with_import(ImportDecl::ty(
                ["RecipeDefinition", "RecipeSelection", "RecipeVariantRecord"],
                "./recipe",
            ))
            .with_import(ImportDecl::ty(
                [
                    "Assign",
                    "DistributiveUnion",
                    "JsxHTMLProps",
                    "JsxStyleProps",
                    "Pretty",
                ],
                "./system",
            ))
            .with_item(type_raw(vue_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        _ => react_object_literal_module(component_name, upper_name, html_props_name),
    }
}

fn react_object_literal_module(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> Module {
    Module::new()
        .with_import(ImportDecl::ty(["ElementType", "JSX"], "react"))
        .with_import(ImportDecl::ty(
            ["RecipeDefinition", "RecipeSelection", "RecipeVariantRecord"],
            "./recipe",
        ))
        .with_import(ImportDecl::ty(
            ["Assign", "JsxHTMLProps", "JsxStyleProps"],
            "./system",
        ))
        .with_item(type_raw(jsx_type_code(
            component_name,
            upper_name,
            html_props_name,
        )))
}

fn jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    let mut code = r#"interface AnyProps {
  [k: string]: unknown
}

export type DataAttrs = Record<`data-${string}`, unknown>

export interface UnstyledProps {
  unstyled?: boolean | undefined
}

export interface AsProps {
  as?: ElementType | undefined
}

export type ComponentProps<T extends ElementType> = T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : T extends { (props: infer Props): any }
    ? Props
    : T extends abstract new (props: infer Props) => any
      ? Props
      : {}

type BaseComponentProps<T extends ElementType> = ComponentProps<T> & UnstyledProps & AsProps

export type __COMPONENT__Props<T extends ElementType, P extends AnyProps = {}> = JsxHTMLProps<
  BaseComponentProps<T>,
  Assign<JsxStyleProps, P>
>

export interface __COMPONENT__<T extends ElementType, P extends AnyProps = {}> {
  (props: __COMPONENT__Props<T, P>): JSX.Element
  displayName?: string | undefined
}

interface RuntimeRecipeFn {
  __type: any
}

export interface JsxFactoryOptions<TProps extends AnyProps, F extends string = string> {
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: readonly F[]
}

// Distributes over the few forwarded keys; never intersects the large key unions.
type ForwardedStyleKeys<T extends ElementType, F extends string> = F extends keyof JsxStyleProps
  ? F extends keyof ComponentProps<T> ? F : never
  : never

/** Props `S`, with each forwarded prop that shares a style prop's name typed from the component. */
export type WithForwardedProps<S, T extends ElementType, F extends string> = [ForwardedStyleKeys<T, F>] extends [never]
  ? S
  : Assign<S, Pick<ComponentProps<T>, ForwardedStyleKeys<T, F>>>

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = JsxHTMLProps<BaseComponentProps<T>, Assign<JsxStyleProps, P>>

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Assign<B, P>>
  : __COMPONENT__<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord = {}, F extends string = never>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>, F>): JsxElement<T, WithForwardedProps<RecipeSelection<P>, T, F>>
  <T extends ElementType, P extends RuntimeRecipeFn, F extends string = never>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>, F>): JsxElement<T, WithForwardedProps<P["__type"], T, F>>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: __COMPONENT__<K, {}>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = JsxHTMLProps<BaseComponentProps<T>, JsxStyleProps>

export type StyledVariantProps<T extends __COMPONENT__<any, any>> = T extends __COMPONENT__<any, infer Props> ? Props : never"#
        .to_owned();

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}

fn preact_jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    framework_jsx_type_code(
        component_name,
        upper_name,
        html_props_name,
        "export type ElementType = JSX.ElementType\n\nexport type { ComponentProps }",
        "ComponentProps<T>",
        "JSX.Element",
        "keyof JSX.IntrinsicElements",
    )
}

fn solid_jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    let mut code = framework_jsx_type_code(
        component_name,
        upper_name,
        html_props_name,
        "export type ElementType = keyof JSX.IntrinsicElements | Component<any>\n\nexport type { ComponentProps }\n\nexport type MaybeAccessor<T> = T | Accessor<T>",
        "ComponentProps<T>",
        "JSX.Element",
        "keyof JSX.IntrinsicElements",
    );
    code = code.replace(
        "defaultProps?: Partial<TProps> & DataAttrs",
        "defaultProps?: MaybeAccessor<Partial<TProps> & DataAttrs>",
    );
    code
}

fn vue_jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    let mut code = r#"export type IntrinsicElement = keyof NativeElements

export type ElementType = IntrinsicElement | Component

export type ComponentProps<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
    ? Props
    : never

interface AnyProps {
  [k: string]: unknown
}

export type DataAttrs = Record<`data-${string}`, unknown>

export interface UnstyledProps {
  unstyled?: boolean | undefined
}

export interface VModelProps {
  modelValue?: any
  'onUpdate:modelValue'?: (value: any) => void
}

export interface AsProps {
  as?: ElementType | undefined
}

export interface __COMPONENT__<T extends ElementType, P extends AnyProps = {}> extends FunctionalComponent<
  JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, Assign<JsxStyleProps, P>>
> {}

interface RuntimeRecipeFn {
  __type: any
}

export interface JsxFactoryOptions<TProps extends AnyProps, F extends string = string> {
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: readonly F[]
}

// Distributes over the few forwarded keys; never intersects the large key unions.
type ForwardedStyleKeys<T extends ElementType, F extends string> = F extends keyof JsxStyleProps
  ? F extends keyof ComponentProps<T> ? F : never
  : never

/** Props `S`, with each forwarded prop that shares a style prop's name typed from the component. */
export type WithForwardedProps<S, T extends ElementType, F extends string> = [ForwardedStyleKeys<T, F>] extends [never]
  ? S
  : Assign<S, Pick<ComponentProps<T>, ForwardedStyleKeys<T, F>>>

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, Assign<JsxStyleProps, P>>

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Pretty<DistributiveUnion<P, B>>>
  : __COMPONENT__<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord = {}, F extends string = never>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>, F>): JsxElement<T, WithForwardedProps<RecipeSelection<P>, T, F>>
  <T extends ElementType, P extends RuntimeRecipeFn, F extends string = never>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>, F>): JsxElement<T, WithForwardedProps<P["__type"], T, F>>
}

export type JsxElements = {
  [K in IntrinsicElement]: __COMPONENT__<K, {}>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps, JsxStyleProps>

export type StyledVariantProps<T extends __COMPONENT__<any, any>> = T extends __COMPONENT__<any, infer Props> ? Props : never"#
        .to_owned();

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}

fn framework_jsx_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
    component_props_decl: &str,
    component_props: &str,
    element_return: &str,
    intrinsic_keys: &str,
) -> String {
    let mut code = format!(
        r#"{component_props_decl}

interface AnyProps {{
  [k: string]: unknown
}}

export type DataAttrs = Record<`data-${{string}}`, unknown>

export interface UnstyledProps {{
  unstyled?: boolean | undefined
}}

export interface AsProps {{
  as?: ElementType | undefined
}}

export interface __COMPONENT__<T extends ElementType, P extends AnyProps = {{}}> {{
  (props: JsxHTMLProps<{component_props} & UnstyledProps & AsProps, Assign<JsxStyleProps, P>>): {element_return}
  displayName?: string
}}

interface RuntimeRecipeFn {{
  __type: any
}}

export interface JsxFactoryOptions<TProps extends AnyProps, F extends string = string> {{
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: readonly F[]
}}

// Distributes over the few forwarded keys; never intersects the large key unions.
type ForwardedStyleKeys<T extends ElementType, F extends string> = F extends keyof JsxStyleProps
  ? F extends keyof {component_props} ? F : never
  : never

/** Props `S`, with each forwarded prop that shares a style prop's name typed from the component. */
export type WithForwardedProps<S, T extends ElementType, F extends string> = [ForwardedStyleKeys<T, F>] extends [never]
  ? S
  : Assign<S, Pick<{component_props}, ForwardedStyleKeys<T, F>>>

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = JsxHTMLProps<{component_props} & UnstyledProps & AsProps, Assign<JsxStyleProps, P>>

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Pretty<DistributiveUnion<P, B>>>
  : __COMPONENT__<T, P>

export interface JsxFactory {{
  <T extends ElementType>(component: T): __COMPONENT__<T, {{}}>
  <T extends ElementType, P extends RecipeVariantRecord = {{}}, F extends string = never>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>, F>): JsxElement<T, WithForwardedProps<RecipeSelection<P>, T, F>>
  <T extends ElementType, P extends RuntimeRecipeFn, F extends string = never>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>, F>): JsxElement<T, WithForwardedProps<P["__type"], T, F>>
}}

export type JsxElements = {{
  [K in {intrinsic_keys}]: __COMPONENT__<K, {{}}>
}}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = JsxHTMLProps<{component_props} & UnstyledProps & AsProps, JsxStyleProps>

export type StyledVariantProps<T extends __COMPONENT__<any, any>> = T extends __COMPONENT__<any, infer Props> ? Props : never"#
    );

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}
