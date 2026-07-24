//! Entry `@layer reset, base, …;` detection and stripping for bundler hosts.
//!
//! [`has_layer_declaration`] finds the injection marker (statement, not block);
//! a sub-layer like `recipes.base` counts for `recipes`.
//! [`strip_layer_order_statements`] removes only statements that cover every
//! configured layer name — unrelated `@layer` orders stay. Both ignore
//! syntax inside strings and comments.

use std::ops::Range;

use crate::css_syntax::{code_matches, first_code_delimiter};

/// Remove Panda `@layer a, b;` order statements (not `@layer a { … }` blocks).
/// Only statements that cover every name in `layers` — same match as
/// [`has_layer_declaration`]. Unrelated order lines stay.
#[must_use]
pub fn strip_layer_order_statements(css: &str, layers: &[&str]) -> String {
    let mut out = String::with_capacity(css.len());
    let mut copied_until = 0;
    for range in panda_layer_order_ranges(css, layers) {
        out.push_str(&css[copied_until..range.start]);
        copied_until = range.end;
    }
    out.push_str(&css[copied_until..]);
    out
}

/// `true` when `css` has an `@layer a, b;` statement covering every name in
/// `layers`. A sub-layer (`recipes.base`) counts for its root (`recipes`).
#[must_use]
pub fn has_layer_declaration(css: &str, layers: &[&str]) -> bool {
    !panda_layer_order_ranges(css, layers).is_empty()
}

fn panda_layer_order_ranges(css: &str, layers: &[&str]) -> Vec<Range<usize>> {
    let mut ranges = Vec::new();
    for idx in code_matches(css, "@layer") {
        let after = &css[idx + "@layer".len()..];
        if !after.starts_with(char::is_whitespace) {
            continue;
        }
        let Some((end, delimiter)) = first_code_delimiter(after, b";{") else {
            continue;
        };
        if delimiter != b';' {
            continue;
        }
        let declared: Vec<&str> = after[..end].split(',').map(str::trim).collect();
        if is_panda_layer_order(&declared, layers) {
            ranges.push(idx..idx + "@layer".len() + end + 1);
        }
    }
    ranges
}

fn is_panda_layer_order(declared: &[&str], layers: &[&str]) -> bool {
    layers.iter().all(|name| declared_contains(declared, name))
}

fn declared_contains(declared: &[&str], name: &str) -> bool {
    declared.iter().any(|declared| {
        *declared == name
            || declared
                .strip_prefix(name)
                .is_some_and(|rest| rest.starts_with('.'))
    })
}
