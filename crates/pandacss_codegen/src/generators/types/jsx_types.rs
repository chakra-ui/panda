use pandacss_shared::pascal_case;

use crate::{CodegenContext, ImportDecl, Item, ItemNode, Module};

pub(super) fn module(ctx: CodegenContext<'_>) -> Module {
    let factory_name = ctx.jsx_factory().to_owned();
    let upper_name = pascal_case(&factory_name);
    let component_name = format!("{upper_name}Component");
    let html_props_name = format!("HTML{upper_name}Props");

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
            &component_name,
            &upper_name,
            &html_props_name,
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
  <T extends ElementType, P extends RecipeVariantRecord>(component: T, recipe: RecipeDefinition<P>, options?: JsxFactoryOptions<JsxRecipeProps<T, RecipeSelection<P>>>): JsxElement<T, RecipeSelection<P>>
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

fn type_raw(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}
