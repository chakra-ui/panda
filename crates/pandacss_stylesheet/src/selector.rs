//! Selector-list utilities: comma splitting and scoped rewriting for preflight.
//!
//! Comma splitting ignores nested `(...)` / `[...]` groups and backslash escapes.
//! Element scoping peels trailing `::pseudo` suffixes only at paren/bracket depth
//! zero, then either rewrites the list with a shared suffix or appends the scope
//! class to each part. Parent scoping prefixes every comma-separated selector.

/// Preflight root selector collapsed to a scope class/id when scoped.
pub const PREFLIGHT_ROOT: &str = "html, :host";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScopeMode {
    /// `.scope descendant` for each comma-separated complex selector.
    Parent,
    /// `.scope` on the scoped element, or `.scope ::pseudo` for standalone pseudo-elements.
    Element,
}

/// Split a selector list on top-level commas, ignoring commas nested inside
/// `(...)`, `[...]`, or string escapes.
#[must_use]
pub fn split_selector_list(selector: &str) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut depth = 0i32;
    let mut start = 0usize;
    let mut escaped = false;

    for (index, ch) in selector.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }

        match ch {
            '(' | '[' => depth += 1,
            ')' | ']' => depth -= 1,
            ',' if depth == 0 => {
                push_part(selector, start, index, &mut parts);
                start = index + ch.len_utf8();
            }
            _ => {}
        }
    }

    push_part(selector, start, selector.len(), &mut parts);
    parts
}

/// Rewrite a selector (or selector list) under `scope` for preflight emission.
#[must_use]
pub fn scope_selector(selector: &str, scope: &str, mode: ScopeMode) -> String {
    if selector == PREFLIGHT_ROOT {
        return scope.to_owned();
    }

    let parts = split_selector_list(selector);
    match mode {
        ScopeMode::Parent => join_scoped(parts.iter().map(|part| format!("{scope} {part}"))),
        ScopeMode::Element => scope_element_selector(&parts, scope),
    }
}

fn scope_element_selector(parts: &[&str], scope: &str) -> String {
    if let Some((trailing, rebuilt)) = extract_shared_trailing_pseudos(parts) {
        return if rebuilt.is_empty() {
            format!("{scope} {trailing}")
        } else {
            format!("{scope} {rebuilt}{trailing}")
        };
    }

    join_scoped(parts.iter().map(|part| scope_element_part(part, scope)))
}

/// Append `scope` to an element selector, or prefix it for standalone pseudo-elements.
fn scope_element_part(part: &str, scope: &str) -> String {
    if is_standalone_pseudo_element(part) {
        format!("{scope} {part}")
    } else {
        format!("{part}{scope}")
    }
}

/// True when the part is only one or more `::pseudo` segments (no subject selector).
fn is_standalone_pseudo_element(part: &str) -> bool {
    peel_trailing_pseudo_elements(part).is_some_and(|(rest, _)| rest.is_empty())
}

/// When every complex selector in the list ends with the same trailing
/// pseudo-element suffix, peel it and return `(trailing, rebuilt)`.
fn extract_shared_trailing_pseudos(parts: &[&str]) -> Option<(String, String)> {
    let mut rebuilt_parts = Vec::with_capacity(parts.len());
    let mut trailing: Option<String> = None;

    for part in parts {
        let (rest, part_trailing) = peel_trailing_pseudo_elements(part)?;
        match &trailing {
            None => trailing = Some(part_trailing),
            Some(shared) if shared == &part_trailing => {}
            Some(_) => return None,
        }
        rebuilt_parts.push(rest);
    }

    Some((trailing?, rebuilt_parts.join(", ")))
}

/// Peel consecutive trailing `::pseudo` segments at paren/bracket depth zero.
fn peel_trailing_pseudo_elements(part: &str) -> Option<(String, String)> {
    let mut rest = part.trim_end().to_owned();
    let mut trailing = String::new();

    while let Some((prefix, pseudo)) = split_trailing_pseudo_element(&rest) {
        trailing = format!("{pseudo}{trailing}");
        rest = prefix;
    }

    (!trailing.is_empty()).then_some((rest, trailing))
}

/// Returns `(prefix, "::name")` when `input` ends with a depth-zero pseudo-element.
fn split_trailing_pseudo_element(input: &str) -> Option<(String, String)> {
    let input = input.trim_end();
    let pseudo_start = trailing_pseudo_element_start(input)?;

    let prefix = input[..pseudo_start].trim_end();
    let pseudo = &input[pseudo_start..];

    if prefix.ends_with(':') && !prefix.ends_with("::") {
        return None;
    }

    Some((prefix.to_owned(), pseudo.to_owned()))
}

/// Index of the leading `::` for a trailing pseudo-element suffix at depth zero.
fn trailing_pseudo_element_start(input: &str) -> Option<usize> {
    let bytes = input.as_bytes();
    let mut end = bytes.len();

    while end > 0 && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }

    let mut name_start = end;
    while name_start > 0 && is_pseudo_name_byte(bytes[name_start - 1]) {
        name_start -= 1;
    }

    if name_start == end {
        return None;
    }

    if name_start < 2 || bytes[name_start - 2..name_start] != *b"::" {
        return None;
    }

    let pseudo_start = name_start - 2;
    depth_zero_at(input, pseudo_start).then_some(pseudo_start)
}

fn depth_zero_at(input: &str, index: usize) -> bool {
    let mut depth = 0i32;
    let mut escaped = false;

    for (offset, ch) in input.char_indices() {
        if offset >= index {
            return depth == 0;
        }
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        match ch {
            '(' | '[' => depth += 1,
            ')' | ']' => depth -= 1,
            _ => {}
        }
    }

    depth == 0
}

fn is_pseudo_name_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_'
}

fn push_part<'a>(input: &'a str, start: usize, end: usize, parts: &mut Vec<&'a str>) {
    let part = input[start..end].trim();
    if !part.is_empty() {
        parts.push(part);
    }
}

fn join_scoped(parts: impl Iterator<Item = String>) -> String {
    parts.collect::<Vec<_>>().join(", ")
}

#[cfg(test)]
mod tests {
    use super::{ScopeMode, peel_trailing_pseudo_elements, scope_selector, split_selector_list};

    #[test]
    fn peel_does_not_strip_pseudo_element_inside_functional_pseudo() {
        assert_eq!(peel_trailing_pseudo_elements(":not(::before)"), None);
    }

    #[test]
    fn peel_strips_depth_zero_trailing_chain() {
        assert_eq!(
            peel_trailing_pseudo_elements("button::before::after"),
            Some(("button".to_owned(), "::before::after".to_owned()))
        );
    }

    #[test]
    fn peel_strips_after_pseudo_class() {
        assert_eq!(
            peel_trailing_pseudo_elements("button:not(:focus)::before"),
            Some(("button:not(:focus)".to_owned(), "::before".to_owned()))
        );
    }

    #[test]
    fn split_respects_commas_inside_functional_pseudo() {
        assert_eq!(
            split_selector_list("table[rules]:not([rules=\"none\"]):not([rules=\"\"])"),
            vec!["table[rules]:not([rules=\"none\"]):not([rules=\"\"])"]
        );
    }

    #[test]
    fn element_scope_compounds_when_pseudo_is_nested_in_not() {
        assert_eq!(
            scope_selector(":not(::before)", ".pd-reset", ScopeMode::Element),
            ":not(::before).pd-reset"
        );
    }
}
