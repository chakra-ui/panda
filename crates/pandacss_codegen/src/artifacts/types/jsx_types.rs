use pandacss_shared::pascal_case;

use crate::artifacts::ts_string::type_raw;
use crate::{CodegenContext, ImportDecl, Module};
use pandacss_config::{CssSyntaxKind, JsxFramework};

pub(super) fn module(ctx: CodegenContext<'_>) -> Module {
    let factory_name = ctx.jsx_factory().to_owned();
    let upper_name = pascal_case(&factory_name);
    let component_name = format!("{upper_name}Component");
    let html_props_name = format!("HTML{upper_name}Props");

    if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        return template_literal_module(ctx, &component_name, &upper_name, &html_props_name);
    }

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
        Some(JsxFramework::Qwik) => Module::new()
            .with_import(ImportDecl::ty(
                ["Component", "QwikIntrinsicElements"],
                "@builder.io/qwik",
            ))
            .with_import(ImportDecl::ty(
                ["RecipeDefinition", "RecipeSelection", "RecipeVariantRecord"],
                "./recipe",
            ))
            .with_import(ImportDecl::ty(
                [
                    "Assign",
                    "DistributiveUnion",
                    "JsxStyleProps",
                    "PatchedHTMLProps",
                    "Pretty",
                ],
                "./system",
            ))
            .with_item(type_raw(qwik_jsx_type_code(
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

fn template_literal_module(
    ctx: CodegenContext<'_>,
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> Module {
    match ctx.config.jsx_framework.as_ref() {
        Some(JsxFramework::Preact) => Module::new()
            .with_import(ImportDecl::ty(["ComponentProps", "JSX"], "preact"))
            .with_item(type_raw(preact_template_literal_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        Some(JsxFramework::Qwik) => Module::new()
            .with_import(ImportDecl::ty(
                ["Component", "QwikIntrinsicElements"],
                "@builder.io/qwik",
            ))
            .with_item(type_raw(qwik_template_literal_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        Some(JsxFramework::Solid) => Module::new()
            .with_import(ImportDecl::ty(
                ["Component", "ComponentProps", "JSX"],
                "solid-js",
            ))
            .with_item(type_raw(solid_template_literal_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        Some(JsxFramework::Vue) => Module::new()
            .with_import(ImportDecl::ty(
                ["Component", "FunctionalComponent", "NativeElements"],
                "vue",
            ))
            .with_item(type_raw(vue_template_literal_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
        _ => Module::new()
            .with_import(ImportDecl::ty(["ElementType", "JSX"], "react"))
            .with_item(type_raw(template_literal_jsx_type_code(
                component_name,
                upper_name,
                html_props_name,
            ))),
    }
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

type BaseComponentProps<T extends ElementType> = ComponentProps<T> & UnstyledProps & AsProps & DataAttrs

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

export interface JsxFactoryOptions<TProps extends AnyProps> {
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: string[]
}

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = JsxHTMLProps<BaseComponentProps<T>, P>

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Assign<B, P>>
  : __COMPONENT__<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<T, RecipeSelection<P>>
  <T extends ElementType, P extends RuntimeRecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>>): JsxElement<T, P["__type"]>
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
        "export type ElementType = JSX.ElementType\n\nexport type ComponentPropsOf<T extends ElementType> = ComponentProps<T>",
        "ComponentPropsOf<T>",
        "JSX.Element",
        "keyof JSX.IntrinsicElements",
    )
}

fn solid_jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    let mut code = framework_jsx_type_code(
        component_name,
        upper_name,
        html_props_name,
        "export type ElementType = keyof JSX.IntrinsicElements | Component<any>\n\nexport type ComponentPropsOf<T extends ElementType> = ComponentProps<T>\n\nexport type MaybeAccessor<T> = T | Accessor<T>",
        "ComponentPropsOf<T>",
        "JSX.Element",
        "keyof JSX.IntrinsicElements",
    );
    code = code.replace(
        "defaultProps?: Partial<TProps> & DataAttrs",
        "defaultProps?: MaybeAccessor<Partial<TProps> & DataAttrs>",
    );
    code
}

fn qwik_jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    let mut code = r#"export type ElementType = keyof QwikIntrinsicElements | Component<any>

export type ComponentPropsOf<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends Component<infer P>
    ? P
    : never

interface AnyProps {
  [k: string]: unknown
}

export type DataAttrs = Record<`data-${string}`, unknown>

export interface UnstyledProps {
  unstyled?: boolean | undefined
}

export interface AsProps {
  as?: ElementType | undefined
}

export interface __COMPONENT__<T extends ElementType, P extends AnyProps = {}> extends Component<Assign<ComponentPropsOf<T> & UnstyledProps & AsProps, Assign<PatchedHTMLProps, Assign<JsxStyleProps, P>>>> {}

interface RuntimeRecipeFn {
  __type: any
}

export interface JsxFactoryOptions<TProps extends AnyProps> {
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: string[]
}

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = ComponentPropsOf<T> & UnstyledProps & AsProps & P

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Pretty<DistributiveUnion<P, B>>>
  : __COMPONENT__<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<T, RecipeSelection<P>>
  <T extends ElementType, P extends RuntimeRecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>>): JsxElement<T, P["__type"]>
}

export type JsxElements = {
  [K in keyof QwikIntrinsicElements]: __COMPONENT__<K, {}>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = Assign<ComponentPropsOf<T> & UnstyledProps & AsProps, JsxStyleProps>

export type StyledVariantProps<T extends __COMPONENT__<any, any>> = T extends __COMPONENT__<any, infer Props> ? Props : never"#
        .to_owned();

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}

fn vue_jsx_type_code(component_name: &str, upper_name: &str, html_props_name: &str) -> String {
    let mut code = r#"export type IntrinsicElement = keyof NativeElements

export type ElementType = IntrinsicElement | Component

export type ComponentPropsOf<T extends ElementType> = T extends IntrinsicElement
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

export interface AsProps {
  as?: ElementType | undefined
}

export interface __COMPONENT__<T extends ElementType, P extends AnyProps = {}> extends FunctionalComponent<
  JsxHTMLProps<ComponentPropsOf<T> & UnstyledProps & AsProps, Assign<JsxStyleProps, P>>
> {}

interface RuntimeRecipeFn {
  __type: any
}

export interface JsxFactoryOptions<TProps extends AnyProps> {
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: string[]
}

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = JsxHTMLProps<ComponentPropsOf<T> & UnstyledProps & AsProps, P>

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Pretty<DistributiveUnion<P, B>>>
  : __COMPONENT__<T, P>

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T, {}>
  <T extends ElementType, P extends RecipeVariantRecord = {}>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<T, RecipeSelection<P>>
  <T extends ElementType, P extends RuntimeRecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>>): JsxElement<T, P["__type"]>
}

export type JsxElements = {
  [K in IntrinsicElement]: __COMPONENT__<K, {}>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = JsxHTMLProps<ComponentPropsOf<T> & UnstyledProps & AsProps, JsxStyleProps>

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
  displayName?: string | undefined
}}

interface RuntimeRecipeFn {{
  __type: any
}}

export interface JsxFactoryOptions<TProps extends AnyProps> {{
  dataAttr?: boolean
  defaultProps?: Partial<TProps> & DataAttrs
  shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean
  forwardProps?: string[]
}}

export type JsxRecipeProps<T extends ElementType, P extends AnyProps> = JsxHTMLProps<{component_props} & UnstyledProps & AsProps, P>

export type JsxElement<T extends ElementType, P extends AnyProps> = T extends __COMPONENT__<infer A, infer B>
  ? __COMPONENT__<A, Pretty<DistributiveUnion<P, B>>>
  : __COMPONENT__<T, P>

export interface JsxFactory {{
  <T extends ElementType>(component: T): __COMPONENT__<T, {{}}>
  <T extends ElementType, P extends RecipeVariantRecord = {{}}>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<T, RecipeSelection<P>>
  <T extends ElementType, P extends RuntimeRecipeFn>(component: T, recipeFn: P, options?: JsxFactoryOptions<JsxRecipeProps<T, P["__type"]>>): JsxElement<T, P["__type"]>
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

fn preact_template_literal_jsx_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> String {
    template_literal_framework_type_code(
        component_name,
        upper_name,
        html_props_name,
        "export type ElementType = JSX.ElementType\n\nexport type ComponentPropsOf<T extends ElementType> = ComponentProps<T>",
        "ComponentPropsOf<T> & AsProps",
        "JSX.Element",
        "keyof JSX.IntrinsicElements",
    )
}

fn qwik_template_literal_jsx_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> String {
    let mut code = r"export type ElementType = keyof QwikIntrinsicElements | Component<any>

export type ComponentPropsOf<T extends ElementType> = T extends keyof QwikIntrinsicElements
  ? QwikIntrinsicElements[T]
  : T extends Component<infer P>
    ? P
    : never

export interface AsProps {
  as?: ElementType | undefined
}

export type __COMPONENT__<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentPropsOf<T> & AsProps) => JSX.Element
}

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T>
}

export type JsxElements = {
  [K in keyof QwikIntrinsicElements]: __COMPONENT__<K>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = ComponentPropsOf<T>"
        .to_owned();

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}

fn solid_template_literal_jsx_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> String {
    template_literal_framework_type_code(
        component_name,
        upper_name,
        html_props_name,
        "export type ElementType<P = any> = keyof JSX.IntrinsicElements | Component<P>\n\nexport type ComponentPropsOf<T extends ElementType> = ComponentProps<T>",
        "ComponentPropsOf<T> & AsProps",
        "JSX.Element",
        "keyof JSX.IntrinsicElements",
    )
}

fn vue_template_literal_jsx_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> String {
    let mut code = r"export type IntrinsicElement = keyof NativeElements

export type ElementType = IntrinsicElement | Component

export type ComponentPropsOf<T extends ElementType> = T extends IntrinsicElement
  ? NativeElements[T]
  : T extends Component<infer Props>
    ? Props
    : never

export interface AsProps {
  as?: ElementType | undefined
}

export type __COMPONENT__<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): FunctionalComponent<ComponentPropsOf<T> & AsProps>
}

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T>
}

export type JsxElements = {
  [K in IntrinsicElement]: __COMPONENT__<K>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = ComponentPropsOf<T>"
        .to_owned();

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}

fn template_literal_framework_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
    component_props_decl: &str,
    component_props: &str,
    element_return: &str,
    intrinsic_keys: &str,
) -> String {
    let mut code = format!(
        r"{component_props_decl}

export interface AsProps {{
  as?: ElementType | undefined
}}

export type __COMPONENT__<T extends ElementType> = {{
  (args: {{ raw: readonly string[] | ArrayLike<string> }}): (props: {component_props}) => {element_return}
  displayName?: string | undefined
}}

export interface JsxFactory {{
  <T extends ElementType>(component: T): __COMPONENT__<T>
}}

export type JsxElements = {{
  [K in {intrinsic_keys}]: __COMPONENT__<K>
}}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = ComponentPropsOf<T>"
    );

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}

fn template_literal_jsx_type_code(
    component_name: &str,
    upper_name: &str,
    html_props_name: &str,
) -> String {
    let mut code = r"export interface AsProps {
  as?: ElementType | undefined
}

export type ComponentProps<T extends ElementType> = (T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : T extends { (props: infer Props): any }
    ? Props
    : T extends abstract new (props: infer Props) => any
      ? Props
      : {}) & AsProps

export type __COMPONENT__<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string | undefined
}

export interface JsxFactory {
  <T extends ElementType>(component: T): __COMPONENT__<T>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: __COMPONENT__<K>
}

export type __UPPER__ = JsxFactory & JsxElements

export type __HTML_PROPS__<T extends ElementType> = ComponentProps<T>"
        .to_owned();

    code = code.replace("__COMPONENT__", component_name);
    code = code.replace("__UPPER__", upper_name);
    code.replace("__HTML_PROPS__", html_props_name)
}
