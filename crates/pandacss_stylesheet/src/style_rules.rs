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

pub(crate) fn append_declarations(target: &mut Vec<Declaration>, declarations: Vec<Declaration>) {
    for declaration in declarations {
        append_declaration(target, declaration);
    }
}

pub(crate) fn append_declaration(target: &mut Vec<Declaration>, declaration: Declaration) {
    if let Some(existing) = target
        .iter_mut()
        .find(|existing| existing.prop == declaration.prop)
    {
        // Importance outranks source order within one declaration block.
        if existing.important && !declaration.important {
            return;
        }
        *existing = declaration;
        return;
    }
    target.push(declaration);
}

#[cfg(test)]
mod tests {
    use insta::assert_yaml_snapshot;

    use super::{Declaration, append_declaration};

    fn declaration(value: &str, important: bool) -> Declaration {
        Declaration {
            prop: "color".to_owned(),
            value: value.to_owned(),
            important,
        }
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
}
