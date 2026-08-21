//! Same-file `const Button = styled('button', { base: … })` chains.
//!
//! A `styled()` component renders through `forwardRef`, which costs a whole
//! extra React component level even when its class string is constant. When the
//! chain is base-only and rooted in an intrinsic tag, every `<Button>` site can
//! be folded to the host element, exactly as `<styled.button>` already is.
//! Anything the fold cannot prove — variants, a non-local base, an options
//! argument beyond style-only `defaultProps` — is simply not recorded, so the
//! runtime chain stays.

use oxc_ast::ast::{
    BindingPattern, Declaration, Expression, Program, Statement, VariableDeclarationKind,
};
use oxc_semantic::SymbolId;
use rustc_hash::FxHashMap;

use crate::matcher::VisitorContext;
use crate::{StyleObject, StyleTree, style_tree::expression_to_style_tree};

/// A local binding the JSX visitor may treat as `<styled.{intrinsic}>`.
#[derive(Debug, Clone, PartialEq)]
pub(crate) struct StyledBinding {
    /// Symbol of the declaration, so a shadowing local can't be folded as this one.
    pub symbol_id: Option<SymbolId>,
    pub intrinsic: String,
    /// Composed `base` styles, outermost-first, so element props still win.
    pub base: Vec<(String, StyleTree)>,
    /// Style-only `defaultProps`, which sit over `base` and under element props.
    /// Kept apart from `base` because wrapping this binding in another
    /// `styled()` level drops them: the runtime renders `__base__`, so the inner
    /// level's `forwardRef` — and its defaults — never run.
    pub default_props: Vec<(String, StyleTree)>,
}

impl StyledBinding {
    /// `base` then `defaultProps`, the precedence the runtime factory applies.
    pub(crate) fn composed_base(&self) -> Vec<(String, StyleTree)> {
        let mut composed = self.base.clone();
        composed.extend(self.default_props.iter().cloned());
        composed
    }
}

pub(crate) type StyledBindings = FxHashMap<String, StyledBinding>;

/// Collects foldable `styled()` bindings from a module's top-level statements.
///
/// Top level only: a chain built inside a function or block could differ per
/// call, and the JSX visitor has no scope information to tell those apart.
pub(crate) fn collect_styled_bindings(
    program: &Program<'_>,
    ctx: &VisitorContext<'_, '_>,
) -> StyledBindings {
    let mut bindings = StyledBindings::default();
    let mut rebindable: Vec<String> = Vec::new();

    for statement in &program.body {
        let declaration = match statement {
            Statement::VariableDeclaration(declaration) => declaration,
            Statement::ExportNamedDeclaration(export) => match export.declaration.as_ref() {
                Some(Declaration::VariableDeclaration(declaration)) => declaration,
                _ => continue,
            },
            _ => continue,
        };

        for declarator in &declaration.declarations {
            let BindingPattern::BindingIdentifier(id) = &declarator.id else {
                continue;
            };
            // `let`/`var` can be reassigned between definition and use.
            if declaration.kind != VariableDeclarationKind::Const {
                rebindable.push(id.name.to_string());
                continue;
            }
            let Some(init) = declarator.init.as_ref() else {
                continue;
            };
            if let Some(binding) = resolve_binding(init, ctx, &bindings) {
                bindings.insert(
                    id.name.to_string(),
                    StyledBinding {
                        symbol_id: id.symbol_id.get(),
                        ..binding
                    },
                );
            }
        }
    }

    for name in rebindable {
        bindings.remove(&name);
    }
    bindings
}

fn resolve_binding(
    init: &Expression<'_>,
    ctx: &VisitorContext<'_, '_>,
    known: &StyledBindings,
) -> Option<StyledBinding> {
    match init.get_inner_expression() {
        // `const Alias = Button`
        // `const Alias = Button` — the alias gets its own symbol below.
        Expression::Identifier(id) => known.get(id.name.as_str()).cloned(),
        Expression::CallExpression(call) => {
            let Expression::Identifier(callee) = call.callee.get_inner_expression() else {
                return None;
            };
            if !is_styled_factory(callee.name.as_str(), ctx) {
                return None;
            }
            // A third `options` argument only folds when it is style-only
            // `defaultProps`; `shouldForwardProp` / `forwardProps` / `dataAttr`
            // are runtime behavior the fold cannot reproduce.
            let default_props = match call.arguments.len() {
                2 => Vec::new(),
                3 => default_prop_styles(call.arguments.get(2)?.as_expression()?, ctx)?,
                _ => return None,
            };

            let (intrinsic, inherited) = match call
                .arguments
                .first()?
                .as_expression()?
                .get_inner_expression()
            {
                Expression::StringLiteral(tag) => (tag.value.to_string(), Vec::new()),
                Expression::Identifier(parent) => {
                    let parent = known.get(parent.name.as_str())?;
                    (parent.intrinsic.clone(), parent.base.clone())
                }
                _ => return None,
            };

            let config = call.arguments.get(1)?.as_expression()?;
            let mut base = inherited;
            base.extend(base_only_entries(config, ctx)?);
            Some(StyledBinding {
                symbol_id: None,
                intrinsic,
                base,
                default_props,
            })
        }
        _ => None,
    }
}

/// True when `name` is the local binding of Panda's imported JSX factory.
fn is_styled_factory(name: &str, ctx: &VisitorContext<'_, '_>) -> bool {
    ctx.aliases.get(name).is_some_and(|matched| {
        ctx.config.matchers.is_jsx_factory(&matched.name)
            || ctx.config.matchers.is_jsx_factory(&matched.alias)
    })
}

/// The `base` entries of a cva config, or `None` when the config carries
/// anything that stops the class string from being constant.
fn base_only_entries(
    config: &Expression<'_>,
    ctx: &VisitorContext<'_, '_>,
) -> Option<Vec<(String, StyleTree)>> {
    let StyleTree::Object(StyleObject { entries, spreads }) =
        expression_to_style_tree(config, ctx.resolver)?
    else {
        return None;
    };
    if !spreads.is_empty() {
        return None;
    }

    let mut base = Vec::new();
    for (key, value) in entries {
        // `variants` / `compoundVariants` / `defaultVariants` make the class
        // depend on props; anything else is unmodelled by the fold.
        if key != "base" {
            return None;
        }
        match value {
            StyleTree::Object(StyleObject {
                entries,
                spreads: base_spreads,
            }) if base_spreads.is_empty() => base = entries,
            _ => return None,
        }
    }
    Some(base)
}

/// Style entries of a `{ defaultProps: { … } }` options argument.
///
/// `None` — refusing the fold — for any other option key, a non-object or
/// spread-carrying shape, or a prop the class string cannot absorb.
fn default_prop_styles(
    options: &Expression<'_>,
    ctx: &VisitorContext<'_, '_>,
) -> Option<Vec<(String, StyleTree)>> {
    let StyleTree::Object(StyleObject { entries, spreads }) =
        expression_to_style_tree(options, ctx.resolver)?
    else {
        return None;
    };
    if !spreads.is_empty() {
        return None;
    }

    let mut default_props = Vec::new();
    for (key, value) in entries {
        if key != "defaultProps" {
            return None;
        }
        let StyleTree::Object(StyleObject {
            entries,
            spreads: prop_spreads,
        }) = value
        else {
            return None;
        };
        if !prop_spreads.is_empty() {
            return None;
        }
        if !entries
            .iter()
            .all(|(prop, _)| is_foldable_style_prop(prop, ctx))
        {
            return None;
        }
        default_props = entries;
    }
    Some(default_props)
}

/// Whether a default prop can be folded into the element's class string.
///
/// Everything else — HTML attributes, `as` / `children` / `className` /
/// `unstyled`, and the `css` prop, which the runtime replaces wholesale instead
/// of merging per key — has to keep the runtime component.
fn is_foldable_style_prop(prop: &str, ctx: &VisitorContext<'_, '_>) -> bool {
    if prop == "css" || prop.ends_with("Css") {
        return false;
    }
    // An unconfigured set means "unknown", not "everything": without the
    // utility table the fold cannot tell `fontWeight` from `type`.
    ctx.config.jsx.valid_style_props.contains(prop)
}
