use crate::{ImportDecl, ImportKind, ImportSpecifier, Item, ItemNode, Module};

pub(super) fn module(factory: &str, component: &str, upper: &str) -> Module {
    Module::new()
        .with_import(value_import(&["createElement", "forwardRef"], "react"))
        .with_import(ImportDecl::value(["css", "cx"], "../css/index"))
        .with_import(ImportDecl::value(["getDisplayName"], "./helper"))
        .with_import(type_import(&[upper], "../types/jsx"))
        .with_item(raw_runtime(
            TEMPLATE_LITERAL_FACTORY_RUNTIME
                .replace("__FACTORY__", factory)
                .replace("__COMPONENT__", component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const TEMPLATE_LITERAL_FACTORY_RUNTIME: &str = r"function createStyledFn(Dynamic) {
  const __base__ = Dynamic.__base__ || Dynamic
  return function styledFn(template) {
    const styles = css.raw(Dynamic.__styles__, template)
    const staticClassName = css(styles)

    const __COMPONENT__ = /* @__PURE__ */ forwardRef(function __COMPONENT__(props, ref) {
      const { as: Element = __base__, className, ...elementProps } = props

      return createElement(Element, {
        ref,
        ...elementProps,
        className: cx(staticClassName, className),
      })
    })

    const name = getDisplayName(__base__)
    __COMPONENT__.displayName = `__FACTORY__.${name}`
    __COMPONENT__.__styles__ = styles
    __COMPONENT__.__base__ = __base__

    return __COMPONENT__
  }
}

function createJsxFactory() {
  const cache = new Map()
  return new Proxy(createStyledFn, {
    apply(_, __, args) {
      return createStyledFn(...args)
    },
    get(_, el) {
      if (!cache.has(el)) cache.set(el, createStyledFn(el))
      return cache.get(el)
    },
  })
}

export const __FACTORY__ = /* @__PURE__ */ createJsxFactory()";

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
