//! Entry `@layer reset, base, …;` detection and stripping for bundler hosts.
//!
//! [`has_layer_declaration`] finds the injection marker (statement, not block);
//! a sub-layer like `recipes.base` counts for `recipes`.
//! [`strip_layer_order_statements`] removes only statements that cover every
//! configured layer name — unrelated `@layer` orders stay. Both skip
//! `/* … */` comments.

/// Byte index of the next `@layer` in `css` that isn't inside a `/* … */`
/// comment.
fn find_at_layer(css: &str) -> Option<usize> {
    let mut search_from = 0;
    loop {
        let layer_pos = css[search_from..].find("@layer").map(|p| search_from + p);
        let comment_pos = css[search_from..].find("/*").map(|p| search_from + p);
        match (layer_pos, comment_pos) {
            (Some(layer), Some(comment)) if comment < layer => {
                let comment_end = css[comment + 2..]
                    .find("*/")
                    .map_or(css.len(), |end| comment + 2 + end + 2);
                search_from = comment_end;
            }
            (Some(layer), _) => return Some(layer),
            (None, _) => return None,
        }
    }
}

/// Remove Panda `@layer a, b;` order statements (not `@layer a { … }` blocks).
/// Only statements that cover every name in `layers` — same match as
/// [`has_layer_declaration`]. Unrelated order lines stay.
#[must_use]
pub fn strip_layer_order_statements(css: &str, layers: &[&str]) -> String {
    let mut out = String::with_capacity(css.len());
    let mut rest = css;
    while let Some(idx) = find_at_layer(rest) {
        out.push_str(&rest[..idx]);
        let after = &rest[idx + "@layer".len()..];
        if !after.starts_with(char::is_whitespace) {
            out.push_str("@layer");
            rest = after;
            continue;
        }
        let semi = after.find(';');
        let brace = after.find('{');
        if let Some(semi) = semi.filter(|s| brace.is_none_or(|b| *s < b)) {
            let declared: Vec<&str> = after[..semi].split(',').map(str::trim).collect();
            if is_panda_layer_order(&declared, layers) {
                rest = &after[semi + 1..];
                continue;
            }
        }
        out.push_str("@layer");
        rest = after;
    }
    out.push_str(rest);
    out
}

/// `true` when `css` has an `@layer a, b;` statement covering every name in
/// `layers`. A sub-layer (`recipes.base`) counts for its root (`recipes`).
#[must_use]
pub fn has_layer_declaration(css: &str, layers: &[&str]) -> bool {
    let mut rest = css;
    while let Some(idx) = find_at_layer(rest) {
        let after = &rest[idx + "@layer".len()..];
        if !after.starts_with(char::is_whitespace) {
            rest = after;
            continue;
        }
        let semi = after.find(';');
        let brace = after.find('{');
        if let Some(semi) = semi.filter(|s| brace.is_none_or(|b| *s < b)) {
            let declared: Vec<&str> = after[..semi].split(',').map(str::trim).collect();
            if is_panda_layer_order(&declared, layers) {
                return true;
            }
        }
        rest = after;
    }
    false
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
