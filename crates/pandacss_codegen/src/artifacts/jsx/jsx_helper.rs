use pandacss_config::CssSyntaxKind;

use crate::{CodegenContext, ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(ctx: CodegenContext<'_>) -> Module {
    if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        return Module::new()
            .with_item(raw_runtime(JSX_TEMPLATE_HELPER_RUNTIME))
            .with_item(raw_type(JSX_TEMPLATE_HELPER_TYPES));
    }

    Module::new()
        .with_import(ImportDecl::value(["css"], "../css/index"))
        .with_item(raw_runtime(JSX_HELPER_RUNTIME))
        .with_item(raw_type(JSX_HELPER_TYPES))
}

pub(super) fn type_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Type,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

pub(super) fn raw_runtime(code: impl Into<String>) -> Item {
    Item::runtime(ItemNode::RawStmt(code.into()))
}

pub(super) fn raw_type(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}

const JSX_TEMPLATE_HELPER_RUNTIME: &str = r"export const getDisplayName = (Component) => {
  if (typeof Component === 'string') return Component
  return Component?.displayName || Component?.name || 'Component'
}";

const JSX_TEMPLATE_HELPER_TYPES: &str =
    r"export declare const getDisplayName: (Component: any) => string";

const JSX_HELPER_RUNTIME: &str = r"export const composeShouldForwardProps = (tag, shouldForwardProp) => {
  if (!tag.__shouldForwardProps__ || !shouldForwardProp) return shouldForwardProp
  return (prop) => tag.__shouldForwardProps__(prop) && shouldForwardProp(prop)
}

export const composeCvaFn = (cvaA, cvaB) => {
  if (cvaA && !cvaB) return cvaA
  if (!cvaA && cvaB) return cvaB
  if ((cvaA.__cva__ && cvaB.__cva__) || (cvaA.__recipe__ && cvaB.__recipe__)) return cvaA.merge(cvaB)
  const error = new TypeError('Cannot merge cva with recipe. Please use either cva or recipe.')
  TypeError.captureStackTrace?.(error)
  throw error
}

export const getDisplayName = (Component) => {
  if (typeof Component === 'string') return Component
  return Component?.displayName || Component?.name || 'Component'
}

const htmlPropsMap = {
  htmlWidth: 'width',
  htmlHeight: 'height',
  htmlTranslate: 'translate',
  htmlContent: 'content',
}
const hasOwn = Object.prototype.hasOwnProperty

export function splitJsxProps(props, shouldForwardProp, variantSet, isCssProperty, skipClass) {
  let htmlProps
  let forwardedProps
  let variantProps
  let propStyles
  let cssStyles
  let elementProps
  const keys = Object.keys(props)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = props[key]
    if (value === void 0) continue
    if (key === 'className' || (skipClass && key === 'class') || key === 'as' || key === 'unstyled' || key === 'children') continue
    if (hasOwn.call(htmlPropsMap, key)) {
      htmlProps ||= Object.create(null)
      htmlProps[htmlPropsMap[key]] = value
    } else if (shouldForwardProp(key)) {
      forwardedProps ||= Object.create(null)
      forwardedProps[key] = value
    } else if (variantSet.has(key)) {
      variantProps ||= Object.create(null)
      variantProps[key] = value
    } else if (key === 'css') {
      cssStyles = value
    } else if (isCssProperty(key)) {
      (propStyles ||= {})[key] = value
    } else {
      elementProps ||= Object.create(null)
      elementProps[key] = value
    }
  }
  return [htmlProps, forwardedProps, variantProps || {}, propStyles, cssStyles, elementProps]
}

export function serializeSplitStyles(propStyles, cssStyles, baseStyles) {
  if (baseStyles !== void 0) {
    return propStyles ? cssStyles !== void 0 ? css(baseStyles, propStyles, cssStyles) : css(baseStyles, propStyles) : css(baseStyles, cssStyles)
  }
  return propStyles ? cssStyles !== void 0 ? css(propStyles, cssStyles) : css(propStyles) : css(cssStyles)
}

export function splitStyleProps(styleProps) {
  let propStyles
  let cssStyles
  const keys = Object.keys(styleProps)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = styleProps[key]
    if (value === void 0) continue
    if (key === 'css') cssStyles = value
    else (propStyles ||= {})[key] = value
  }
  return [propStyles, cssStyles]
}";

const JSX_HELPER_TYPES: &str = r"export declare const composeShouldForwardProps: (tag: any, shouldForwardProp: any) => any
export declare const composeCvaFn: (cvaA: any, cvaB: any) => any
export declare const getDisplayName: (Component: any) => string
export declare function splitJsxProps(props: any, shouldForwardProp: any, variantSet: Set<string>, isCssProperty: (prop: string) => boolean, skipClass?: boolean): [any, any, any, any, any, any]
export declare function serializeSplitStyles(propStyles: any, cssStyles: any, baseStyles?: any): string
export declare function splitStyleProps(styleProps: any): [any, any]";
