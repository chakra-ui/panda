//! Same-file `const Button = styled('button', { base: … })` chains.
//!
//! A `styled()` component renders through `forwardRef`, which costs a whole
//! extra React component level even when its class string is constant. When the
//! chain is base-only and rooted in an intrinsic tag, every `<Button>` site can
//! be folded to the host element, exactly as `<styled.button>` already is.
//! Anything the fold cannot prove — variants, an options argument, a non-local
//! base — is simply not recorded, so the runtime chain stays.

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
            // A third `options` argument carries `defaultProps` /
            // `shouldForwardProp`, neither of which the fold reproduces.
            if call.arguments.len() != 2 {
                return None;
            }

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
