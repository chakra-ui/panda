use pandacss_tokens::TokenDictionary;
use rustc_hash::FxHashSet;

use crate::css_syntax::{code_bytes, code_matches};

/// Visits candidate keyframe names in a resolved animation value, including
/// token aliases, every conditional token value, and `var()` fallbacks.
/// Callers match candidates against their configured keyframes. Names are visited once.
pub fn visit_animation_names(
    value: &str,
    tokens: Option<&TokenDictionary>,
    mut visit: impl FnMut(&str),
) {
    let mut pending = vec![value];
    let mut visited_tokens = FxHashSet::default();
    let mut visited_names = FxHashSet::default();
    while let Some(value) = pending.pop() {
        let mut offset = 0;
        for start in code_matches(value, "var(") {
            if start < offset {
                continue;
            }
            visit_direct_names(&value[offset..start], &mut visited_names, &mut visit);
            let inner = &value[start + "var(".len()..];
            let Some((end, fallback)) = variable_bounds(inner) else {
                offset = value.len();
                break;
            };
            let name = inner[..fallback.unwrap_or(end)].trim();
            if let Some(comma) = fallback {
                pending.push(inner[comma + 1..end].trim());
            }
            if let Some(tokens) = tokens
                && let Some(token) = tokens.token_by_var(&format!("var({name})"))
                && visited_tokens.insert(token.path.as_ref())
            {
                for condition in tokens.conditions().iter().rev() {
                    if let Some(variant) = tokens.token_with_condition(&token.path, condition) {
                        pending.push(variant.value.as_ref());
                    }
                }
                pending.push(token.value.as_ref());
            }
            offset = start + "var(".len() + end + 1;
        }
        visit_direct_names(&value[offset..], &mut visited_names, &mut visit);
    }
}

fn visit_direct_names<'a>(
    value: &'a str,
    visited: &mut FxHashSet<&'a str>,
    visit: &mut impl FnMut(&str),
) {
    for name in value
        .split(|ch: char| ch.is_ascii_whitespace() || ch == ',')
        .map(|part| part.trim_matches(['"', '\'']))
        .filter(|part| !part.is_empty())
    {
        if visited.insert(name) {
            visit(name);
        }
    }
}

fn variable_bounds(inner: &str) -> Option<(usize, Option<usize>)> {
    let mut depth = 0;
    let mut fallback = None;
    for (index, byte) in code_bytes(inner, 0) {
        match byte {
            b'(' => depth += 1,
            b')' if depth == 0 => return Some((index, fallback)),
            b')' => depth -= 1,
            b',' if depth == 0 && fallback.is_none() => fallback = Some(index),
            _ => {}
        }
    }
    None
}
