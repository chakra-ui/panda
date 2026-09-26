//! Plans disjoint finite and runtime fragments without re-parsing source.

use pandacss_extractor::{CallFacts, ObjectFacts, StyleObject, StyleTree};
use pandacss_literal::Literal;
use pandacss_shared::Span;

use pandacss_project::Config;

use super::css_keys::{StyleKeys, insert_disjoint, style_keys};
use super::helper::CX_HELPER_LOCAL;
use super::js;
use super::plan::{HelperCxMode, Rewrite, TransformHelperFacts};
use super::resolve::{classes_for_css_args, span_slice};
use super::style_lower::{self, ClassExpr};

struct Fragment {
    tree: StyleTree,
    runtime: Option<RuntimeProperty>,
}

struct RuntimeProperty {
    argument: usize,
    scopes: Vec<String>,
    span: Span,
}

enum ObjectMember {
    Scope { key: String, members: Vec<Self> },
    Property(String),
}

#[must_use]
pub(super) fn rewrite(
    config: &Config,
    source: &str,
    span: Span,
    trees: &[Option<StyleTree>],
    facts: &CallFacts,
    helper_cx: HelperCxMode,
) -> Option<Rewrite> {
    if helper_cx == HelperCxMode::False || trees.len() != facts.args.len() {
        return None;
    }
    let mut fragments = Vec::new();
    for (index, (tree, argument)) in trees.iter().zip(&facts.args).enumerate() {
        let StyleTree::Object(object) = tree.as_ref()? else {
            return None;
        };
        collect_object(
            index,
            object,
            argument.as_ref()?.object.as_ref()?,
            &mut Vec::new(),
            &mut fragments,
        )?;
    }
    if !fragments.iter().any(|fragment| fragment.runtime.is_some()) {
        return None;
    }
    let mut keys = StyleKeys::default();
    let mut finite = Vec::new();
    let mut printed = Vec::new();
    let mut preserved = vec![facts.callee_span];
    let callee = span_slice(source, facts.callee_span)?;
    for fragment in &fragments {
        insert_disjoint(&mut keys, style_keys(config, &fragment.tree)?)?;
        if let Some(runtime) = &fragment.runtime {
            preserved.push(runtime.span);
            printed.push(None);
        } else {
            let (expr, spans) =
                style_lower::lower_css_args(config, source, &[Some(fragment.tree.clone())])?;
            preserved.extend(spans);
            finite.push(fragment.tree.clone());
            printed.push(Some(expr));
        }
    }
    if finite.is_empty() {
        return None;
    }
    let content = if printed
        .iter()
        .flatten()
        .all(|expr| matches!(expr, ClassExpr::Lit(_)))
    {
        print_pure_split(config, source, callee, &finite, &fragments)?
    } else {
        print_ordered_split(source, callee, &fragments, &printed)?
    };
    Some(Rewrite {
        start: span.start,
        end: span.end,
        content,
        preserved,
        helper: TransformHelperFacts::cx(),
    })
}

fn collect_object(
    argument: usize,
    object: &StyleObject,
    facts: &ObjectFacts,
    scopes: &mut Vec<String>,
    fragments: &mut Vec<Fragment>,
) -> Option<()> {
    // Opaque and conditional spreads need whole-object merge semantics.
    if !object.spreads.is_empty() {
        return None;
    }
    let mut explicit = std::collections::HashSet::new();
    for property in &facts.properties {
        if !property.is_spread() && !explicit.insert(property.key.as_deref()?) {
            return None;
        }
    }
    // Folded spreads lose property provenance; keep mixed objects intact.
    if facts
        .properties
        .iter()
        .any(pandacss_extractor::ObjectPropertyFacts::is_spread)
    {
        return None;
    }
    for property in &facts.properties {
        if property.is_accessor_or_method {
            return None;
        }
        let key = property.key.as_deref()?;
        let value = object
            .entries
            .iter()
            .find(|(name, _)| name == key)
            .map(|(_, value)| value)?;
        if let StyleTree::Object(nested) = value
            && let Some(nested_facts) = property
                .value
                .as_ref()
                .and_then(|value| value.object.as_ref())
            && style_lower::style_tree_is_open(value)
        {
            scopes.push(key.to_owned());
            collect_object(argument, nested, nested_facts, scopes, fragments)?;
            scopes.pop();
        } else {
            let runtime = (style_lower::style_tree_is_open(value)
                || style_lower::style_tree_has_value_and(value))
            .then(|| RuntimeProperty {
                argument,
                scopes: scopes.clone(),
                span: property.span,
            });
            fragments.push(Fragment {
                tree: wrap(scopes, key, value.clone()),
                runtime,
            });
        }
    }
    Some(())
}

fn wrap(scopes: &[String], key: &str, value: StyleTree) -> StyleTree {
    let mut tree = StyleTree::Object(StyleObject {
        entries: vec![(key.to_owned(), value)],
        spreads: Vec::new(),
    });
    for scope in scopes.iter().rev() {
        tree = StyleTree::Object(StyleObject {
            entries: vec![(scope.clone(), tree)],
            spreads: Vec::new(),
        });
    }
    tree
}

fn print_pure_split(
    config: &Config,
    source: &str,
    callee: &str,
    finite: &[StyleTree],
    fragments: &[Fragment],
) -> Option<String> {
    let args = finite
        .iter()
        .map(pandacss_extractor::project_literal)
        .collect::<Vec<Option<Literal>>>();
    let classes = classes_for_css_args(config, &args)?;
    let runtime = print_runtime(source, callee, fragments)?;
    Some(format!(
        "{CX_HELPER_LOCAL}({}, {runtime})",
        js::string(&classes.join(" "))
    ))
}

fn print_ordered_split(
    source: &str,
    callee: &str,
    fragments: &[Fragment],
    printed: &[Option<ClassExpr>],
) -> Option<String> {
    let mut parts = Vec::new();
    let mut index = 0;
    while index < fragments.len() {
        if let Some(expr) = &printed[index] {
            parts.push(style_lower::print_class_expr(expr));
            index += 1;
        } else {
            let start = index;
            while index < fragments.len() && printed[index].is_none() {
                index += 1;
            }
            parts.push(print_runtime(source, callee, &fragments[start..index])?);
        }
    }
    Some(format!("{CX_HELPER_LOCAL}({})", parts.join(", ")))
}

fn print_runtime(source: &str, callee: &str, fragments: &[Fragment]) -> Option<String> {
    let mut arguments = Vec::new();
    let mut members = Vec::new();
    let mut previous = None;
    for runtime in fragments
        .iter()
        .filter_map(|fragment| fragment.runtime.as_ref())
    {
        if previous.is_some_and(|index| index != runtime.argument) {
            arguments.push(format!("{{ {} }}", print_members(&members)));
            members.clear();
        }
        previous = Some(runtime.argument);
        insert_member(
            &mut members,
            &runtime.scopes,
            span_slice(source, runtime.span)?,
        );
    }
    arguments.push(format!("{{ {} }}", print_members(&members)));
    Some(format!("{callee}({})", arguments.join(", ")))
}

fn insert_member(members: &mut Vec<ObjectMember>, scopes: &[String], property: &str) {
    let Some((scope, rest)) = scopes.split_first() else {
        members.push(ObjectMember::Property(property.to_owned()));
        return;
    };
    if let Some(ObjectMember::Scope { members, .. }) = members
        .iter_mut()
        .find(|member| matches!(member, ObjectMember::Scope { key, .. } if key == scope))
    {
        insert_member(members, rest, property);
    } else {
        let mut children = Vec::new();
        insert_member(&mut children, rest, property);
        members.push(ObjectMember::Scope {
            key: scope.clone(),
            members: children,
        });
    }
}

fn print_members(members: &[ObjectMember]) -> String {
    members
        .iter()
        .map(|member| match member {
            ObjectMember::Property(source) => source.clone(),
            ObjectMember::Scope { key, members } => {
                format!("{}: {{ {} }}", js::key(key), print_members(members))
            }
        })
        .collect::<Vec<_>>()
        .join(", ")
}
