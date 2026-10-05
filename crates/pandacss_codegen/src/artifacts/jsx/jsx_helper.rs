use crate::{CodegenContext, ImportDecl, ImportKind, ImportSpecifier, Item, Module, RuntimeImport};

pub(super) fn module(ctx: CodegenContext<'_>) -> Module {
    Module::new()
        .with_import(ImportDecl::value(
            ["css", "cva"],
            &ctx.runtime_import(RuntimeImport::CssIndex, "../css/index"),
        ))
        .with_import(type_import(&["RecipeCreatorFn"], "../types/recipe"))
        .with_import(type_import(&["SystemStyleObject"], "../types/system"))
        .with_item(Item::typed_source(JSX_HELPER_SOURCE))
}

pub(super) fn value_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Value,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
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

const JSX_HELPER_SOURCE: &str = r"type Props = Record<string, unknown>

export type ShouldForwardProp = (prop: string, variantKeys?: string[]) => boolean

/** A `cva` or config recipe function, as the JSX runtime reads it. */
export interface JsxRecipeFn {
  (props?: Props, withCompoundVariants?: boolean): string
  raw(props?: Props): SystemStyleObject
  merge(other: JsxRecipeFn, cvaFn: RecipeCreatorFn): JsxRecipeFn
  variantKeys: string[]
  __cva__?: boolean
  __recipe__?: boolean
  __name__?: string
  __memoizedRaw__?: (props?: Props) => SystemStyleObject
  __getCompoundVariantClasses__?: (props: Props) => string
}

/** Markers the factory sets on the components it creates. */
export interface StyledMarkers {
  __cva__?: JsxRecipeFn
  __base__?: unknown
  __shouldForwardProps__?: ShouldForwardProp
}

export const composeShouldForwardProps = (tag: StyledMarkers, shouldForwardProp: ShouldForwardProp): ShouldForwardProp => {
  if (!tag.__shouldForwardProps__ || !shouldForwardProp) return shouldForwardProp
  return (prop) => tag.__shouldForwardProps__!(prop) && shouldForwardProp(prop)
}

export const composeCvaFn = (cvaA: JsxRecipeFn | undefined, cvaB: JsxRecipeFn): JsxRecipeFn => {
  if (cvaA && !cvaB) return cvaA
  if (!cvaA && cvaB) return cvaB
  if ((cvaA!.__cva__ && cvaB.__cva__) || (cvaA!.__recipe__ && cvaB.__recipe__)) return cvaA!.merge(cvaB, cva)
  const error = new TypeError('Cannot merge cva with recipe. Please use either cva or recipe.')
  TypeError.captureStackTrace?.(error)
  throw error
}

export const getDisplayName = (Component: string | { displayName?: string; name?: string } | undefined): string => {
  if (typeof Component === 'string') return Component
  return Component?.displayName || Component?.name || 'Component'
}

const htmlPropsMap: Record<string, string> = {
  htmlWidth: 'width',
  htmlHeight: 'height',
  htmlTranslate: 'translate',
  htmlContent: 'content',
}
const hasOwn = Object.prototype.hasOwnProperty

export type SplitJsxProps = [
  htmlProps: Props | undefined,
  forwardedProps: Props | undefined,
  variantProps: Props,
  propStyles: SystemStyleObject | undefined,
  cssStyles: SystemStyleObject | undefined,
  elementProps: Props | undefined,
]

export function splitJsxProps(props: Props, shouldForwardProp: (prop: string) => boolean, variantSet: Set<string>, isCssProperty: (prop: string) => boolean, skipClass?: boolean): SplitJsxProps {
  let htmlProps: Props | undefined
  let forwardedProps: Props | undefined
  let variantProps: Props | undefined
  let propStyles: Props | undefined
  let cssStyles: SystemStyleObject | undefined
  let elementProps: Props | undefined
  const keys = Object.keys(props)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    const value = props[key]
    if (value === void 0) continue
    if (key === 'className' || (skipClass && key === 'class') || key === 'as' || key === 'unstyled' || key === 'children') continue
    if (hasOwn.call(htmlPropsMap, key)) {
      htmlProps ||= Object.create(null) as Props
      htmlProps[htmlPropsMap[key]!] = value
    } else if (shouldForwardProp(key)) {
      forwardedProps ||= Object.create(null) as Props
      forwardedProps[key] = value
    } else if (variantSet.has(key)) {
      variantProps ||= Object.create(null) as Props
      variantProps[key] = value
    } else if (key === 'css') {
      cssStyles = value as SystemStyleObject
    } else if (isCssProperty(key)) {
      (propStyles ||= {})[key] = value
    } else {
      elementProps ||= Object.create(null) as Props
      elementProps[key] = value
    }
  }
  return [htmlProps, forwardedProps, variantProps || {}, propStyles as SystemStyleObject | undefined, cssStyles, elementProps]
}

export function serializeSplitStyles(propStyles: SystemStyleObject | undefined, cssStyles: SystemStyleObject | undefined, baseStyles?: SystemStyleObject): string {
  if (baseStyles !== void 0) {
    return propStyles ? cssStyles !== void 0 ? css(baseStyles, propStyles, cssStyles) : css(baseStyles, propStyles) : css(baseStyles, cssStyles)
  }
  return propStyles ? cssStyles !== void 0 ? css(propStyles, cssStyles) : css(propStyles) : css(cssStyles)
}

export function splitStyleProps(styleProps: Props): [propStyles: SystemStyleObject | undefined, cssStyles: SystemStyleObject | undefined] {
  let propStyles: Props | undefined
  let cssStyles: SystemStyleObject | undefined
  const keys = Object.keys(styleProps)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!
    const value = styleProps[key]
    if (value === void 0) continue
    if (key === 'css') cssStyles = value as SystemStyleObject
    else (propStyles ||= {})[key] = value
  }
  return [propStyles as SystemStyleObject | undefined, cssStyles]
}";
