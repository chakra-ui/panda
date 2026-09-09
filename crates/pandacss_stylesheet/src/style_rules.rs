//! Internal style-rule model used by the emitter: rule identity, declarations,
//! and write-time coalescing. Condition resolution lives in `conditions.rs`;
//! cascade ordering lives in `sort.rs`.

use std::borrow::Cow;

use crate::grouped::{GroupNode, GroupedDeclaration, RuleBody};
use crate::writer::CssWriter;

/// User-facing rule identity before condition lowering. Class targets still
/// need Panda class formatting; selector targets are already CSS selectors.
pub(crate) enum Target<'a> {
    Class {
        name: &'a str,
        conditions: &'a [&'a str],
        important: bool,
    },
    Selector {
        selector: Cow<'a, str>,
    },
}

/// Ready-to-write selector plus enclosing at-rule wrappers. This is the
/// lowered form, not a separate public stylesheet concept.
#[derive(Clone, PartialEq, Eq)]
pub(crate) struct LoweredTarget {
    pub selector: String,
    pub wrappers: Vec<String>,
    /// False when merging this selector into a comma list could make a
    /// baseline-compatible neighbor invalid in older engines.
    pub merge_safe: bool,
}

impl LoweredTarget {
    pub(crate) fn new(selector: impl Into<String>) -> Self {
        let selector = selector.into();
        Self {
            merge_safe: crate::css_syntax::selector_is_merge_safe(&selector),
            selector,
            wrappers: Vec::new(),
        }
    }

    pub(crate) fn generated_class(selector: impl Into<String>) -> Self {
        Self::new(selector)
    }
}

#[derive(Clone)]
pub(crate) struct Declaration {
    pub prop: String,
    pub value: String,
    pub important: bool,
}

pub(crate) struct StyleRule {
    pub target: LoweredTarget,
    pub declarations: Vec<Declaration>,
}

/// Keep adjacent rules with the same lowered target in one CSS block.
pub(crate) fn push_pending_rule(
    pending: &mut Option<StyleRule>,
    target: LoweredTarget,
    declarations: Vec<Declaration>,
    mut flush: impl FnMut(StyleRule),
) {
    match pending {
        Some(pending) if pending.target == target => {
            append_declarations(&mut pending.declarations, declarations);
        }
        Some(_) => {
            let previous = pending.take().expect("pending style rule");
            flush(previous);
            *pending = Some(StyleRule {
                target,
                declarations,
            });
        }
        None => {
            *pending = Some(StyleRule {
                target,
                declarations,
            });
        }
    }
}

pub(crate) fn flush_pending_rule(pending: Option<StyleRule>, mut flush: impl FnMut(StyleRule)) {
    if let Some(pending) = pending {
        flush(pending);
    }
}

pub(crate) fn push_grouped_rule(
    grouped: &mut GroupNode,
    rule: &LoweredTarget,
    declarations: Vec<Declaration>,
) {
    grouped.push_rule(
        &rule.wrappers,
        RuleBody {
            selector: rule.selector.clone(),
            merge_safe: rule.merge_safe,
            declarations: declarations
                .into_iter()
                .map(|declaration| GroupedDeclaration {
                    prop: declaration.prop,
                    value: declaration.value,
                    important: declaration.important,
                })
                .collect(),
        },
    );
}

pub(crate) fn write_rule(
    writer: &mut CssWriter,
    rule: &LoweredTarget,
    declarations: &[Declaration],
) {
    write_with_wrappers(writer, &rule.wrappers, |writer| {
        writer.rule(&rule.selector, |writer| {
            for declaration in declarations {
                writer.declaration(&declaration.prop, &declaration.value, declaration.important);
            }
        });
    });
}

pub(crate) fn write_with_wrappers(
    writer: &mut CssWriter,
    wrappers: &[String],
    write: impl FnOnce(&mut CssWriter),
) {
    fn inner(
        writer: &mut CssWriter,
        wrappers: &[String],
        index: usize,
        write: impl FnOnce(&mut CssWriter),
    ) {
        if let Some(wrapper) = wrappers.get(index) {
            writer.at_rule(wrapper, |writer| inner(writer, wrappers, index + 1, write));
        } else {
            write(writer);
        }
    }
    inner(writer, wrappers, 0, write);
}

/// Appends declarations, keeping fallback runs intact. Consecutive
/// same-property declarations are one run; appending them one at a time would
/// collapse the run to its last member.
pub(crate) fn append_declarations(target: &mut Vec<Declaration>, declarations: Vec<Declaration>) {
    let mut run: Vec<Declaration> = Vec::new();
    for declaration in declarations {
        if run
            .first()
            .is_some_and(|first| first.prop != declaration.prop)
        {
            append_declaration_run(target, std::mem::take(&mut run));
        }
        run.push(declaration);
    }
    append_declaration_run(target, run);
}

pub(crate) fn append_declaration(target: &mut Vec<Declaration>, declaration: Declaration) {
    append_declaration_run(target, vec![declaration]);
}

/// Appends an ordered run of declarations that all share one property.
///
/// A run is one style value, so it replaces — or loses to — an existing run as
/// a unit. Replaced in place, so declaration order stays stable.
pub(crate) fn append_declaration_run(target: &mut Vec<Declaration>, run: Vec<Declaration>) {
    let Some(prop) = run.first().map(|declaration| declaration.prop.clone()) else {
        return;
    };
    let Some(first) = target.iter().position(|existing| existing.prop == prop) else {
        target.extend(run);
        return;
    };

    // Importance outranks source order within one declaration block.
    if target[first].important && !run.iter().any(|declaration| declaration.important) {
        return;
    }

    target.retain(|existing| existing.prop != prop);
    let tail = target.split_off(first);
    target.extend(run);
    target.extend(tail);
}

#[cfg(test)]
mod tests {
    use insta::assert_yaml_snapshot;

    use super::{Declaration, append_declaration, append_declaration_run};

    fn declaration(value: &str, important: bool) -> Declaration {
        named_declaration("color", value, important)
    }

    fn named_declaration(prop: &str, value: &str, important: bool) -> Declaration {
        Declaration {
            prop: prop.to_owned(),
            value: value.to_owned(),
            important,
        }
    }

    fn dump(declarations: &[Declaration]) -> Vec<serde_json::Value> {
        declarations
            .iter()
            .map(|declaration| {
                serde_json::json!({
                    "prop": declaration.prop,
                    "value": declaration.value,
                    "important": declaration.important,
                })
            })
            .collect()
    }

    #[test]
    fn normal_declaration_does_not_replace_important_declaration() {
        let mut declarations = vec![declaration("red", true)];
        append_declaration(&mut declarations, declaration("blue", false));

        assert_yaml_snapshot!(
            declarations
                .iter()
                .map(|declaration| serde_json::json!({
                    "prop": declaration.prop,
                    "value": declaration.value,
                    "important": declaration.important,
                }))
                .collect::<Vec<_>>(),
            @r"
        - prop: color
          value: red
          important: true
        "
        );
    }

    #[test]
    fn important_declaration_replaces_normal_declaration() {
        let mut declarations = vec![declaration("red", false)];
        append_declaration(&mut declarations, declaration("blue", true));

        assert_yaml_snapshot!(
            declarations
                .iter()
                .map(|declaration| serde_json::json!({
                    "prop": declaration.prop,
                    "value": declaration.value,
                    "important": declaration.important,
                }))
                .collect::<Vec<_>>(),
            @r"
        - prop: color
          value: blue
          important: true
        "
        );
    }

    #[test]
    fn a_run_replaces_an_existing_declaration_in_place() {
        let mut declarations = vec![
            named_declaration("display", "flex", false),
            declaration("green", false),
            named_declaration("margin", "auto", false),
        ];
        append_declaration_run(
            &mut declarations,
            vec![declaration("red", false), declaration("blue", false)],
        );

        // The run lands where the replaced declaration was, not at the end.
        assert_yaml_snapshot!(dump(&declarations), @r"
        - prop: display
          value: flex
          important: false
        - prop: color
          value: red
          important: false
        - prop: color
          value: blue
          important: false
        - prop: margin
          value: auto
          important: false
        ");
    }

    #[test]
    fn a_later_scalar_replaces_a_whole_run() {
        let mut declarations = Vec::new();
        append_declaration_run(
            &mut declarations,
            vec![declaration("red", false), declaration("blue", false)],
        );
        append_declaration(&mut declarations, declaration("green", false));

        // Last write wins as a unit — no member of the old run survives.
        assert_yaml_snapshot!(dump(&declarations), @r"
        - prop: color
          value: green
          important: false
        ");
    }

    #[test]
    fn a_normal_run_does_not_replace_an_important_declaration() {
        let mut declarations = vec![declaration("green", true)];
        append_declaration_run(
            &mut declarations,
            vec![declaration("red", false), declaration("blue", false)],
        );

        assert_yaml_snapshot!(dump(&declarations), @r"
        - prop: color
          value: green
          important: true
        ");
    }

    #[test]
    fn an_important_run_replaces_a_normal_declaration() {
        let mut declarations = vec![declaration("green", false)];
        append_declaration_run(
            &mut declarations,
            vec![declaration("red", true), declaration("blue", true)],
        );

        assert_yaml_snapshot!(dump(&declarations), @r"
        - prop: color
          value: red
          important: true
        - prop: color
          value: blue
          important: true
        ");
    }

    #[test]
    fn an_empty_run_changes_nothing() {
        let mut declarations = vec![declaration("green", false)];
        append_declaration_run(&mut declarations, Vec::new());

        assert_yaml_snapshot!(dump(&declarations), @r"
        - prop: color
          value: green
          important: false
        ");
    }
}
