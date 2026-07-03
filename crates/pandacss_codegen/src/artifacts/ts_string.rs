//! Small shared helpers for building TypeScript type source — string literals,
//! unions, member quoting, and raw type statements. Used across the `types`,
//! `patterns`, and recipe/jsx type artifacts.

use crate::{Item, ItemNode};

/// A double-quoted TS string literal (`red` → `"red"`).
pub(crate) fn string_literal(value: &str) -> String {
    format!("{value:?}")
}

/// A `" | "`-joined union of string literals, or `fallback` when empty.
pub(crate) fn string_union(values: &[String], fallback: &str) -> String {
    if values.is_empty() {
        return fallback.into();
    }

    values
        .iter()
        .map(|value| string_literal(value))
        .collect::<Vec<_>>()
        .join(" | ")
}

/// Like [`string_union`] but always unions the `fallback` in (`"a" | "b" | Fallback`).
pub(crate) fn string_union_with_fallback(values: &[String], fallback: &str) -> String {
    if values.is_empty() {
        return fallback.into();
    }
    format!("{} | {fallback}", string_union(values, fallback))
}

/// An interface/object member name: bare when a valid JS identifier, else quoted.
pub(crate) fn quote_member(value: &str) -> String {
    if is_identifier(value) {
        value.into()
    } else {
        string_literal(value)
    }
}

/// Whether `value` is a valid unquoted JS identifier.
pub(crate) fn is_identifier(value: &str) -> bool {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    (first.is_ascii_alphabetic() || first == '_' || first == '$')
        && chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '$')
}

/// A raw type statement item from pre-rendered TS source.
pub(crate) fn type_raw(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}
