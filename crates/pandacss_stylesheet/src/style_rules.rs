//! Small internal style-rule model used by the emitter.
//!
//! Keep this module focused on rule identity, declarations, and write-time
//! coalescing. Condition resolution lives in `conditions.rs`; cascade ordering
//! lives in `sort.rs`.

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
}

impl LoweredTarget {
    pub(crate) fn new(selector: impl Into<String>) -> Self {
        Self {
            selector: selector.into(),
            wrappers: Vec::new(),
        }
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
        // Later declarations for the same CSS property win inside one block.
        *existing = declaration;
        return;
    }
    target.push(declaration);
}
