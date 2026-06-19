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

/// Replace nesting `&` tokens with `parent` in one complex selector.
///
/// Ampersands inside quoted attribute strings are left untouched.
#[must_use]
pub(crate) fn replace_nesting_parent(selector: &str, parent: &str) -> String {
    let mut out = String::with_capacity(selector.len() + parent.len());
    let mut in_double = false;
    let mut in_single = false;
    let mut escaped = false;

    for ch in selector.chars() {
        if escaped {
            out.push(ch);
            escaped = false;
            continue;
        }
        if ch == '\\' {
            out.push(ch);
            escaped = true;
            continue;
        }
        if ch == '"' && !in_single {
            in_double = !in_double;
            out.push(ch);
            continue;
        }
        if ch == '\'' && !in_double {
            in_single = !in_single;
            out.push(ch);
            continue;
        }
        if ch == '&' && !in_double && !in_single {
            out.push_str(parent);
            continue;
        }
        out.push(ch);
    }

    out
}

/// Cartesian-product `&` substitution for comma-separated selector lists.
#[must_use]
pub(crate) fn replace_selector_parent(raw: &str, parent: &str) -> String {
    let parent_selectors = split_selector_list(parent);
    let raw_selectors = split_selector_list(raw);
    let mut out = Vec::new();
    for parent in &parent_selectors {
        for raw in &raw_selectors {
            out.push(replace_nesting_parent(raw, parent));
        }
    }
    out.join(", ")
}

#[cfg(test)]
mod tests {
    use super::{
        ScopeMode, peel_trailing_pseudo_elements, replace_nesting_parent, replace_selector_parent,
        scope_selector, split_selector_list,
    };

    #[test]
    fn replace_ignores_ampersand_inside_double_quoted_attribute() {
        assert_eq!(
            replace_nesting_parent(r#"&[data-category="sound & vision"]"#, ".a"),
            r#".a[data-category="sound & vision"]"#
        );
    }

    #[test]
    fn replace_ignores_ampersand_inside_single_quoted_attribute() {
        assert_eq!(
            replace_nesting_parent(r"&[data-category='Sound & Vision']", ".room"),
            r".room[data-category='Sound & Vision']"
        );
    }

    #[test]
    fn replace_all_nesting_ampersands_in_not() {
        assert_eq!(replace_nesting_parent("&:not(&.no)", ".a"), ".a:not(.a.no)");
    }

    #[test]
    fn replace_selector_list_cartesian_product() {
        assert_eq!(
            replace_selector_parent("&:hover, &:active", ".a, .b"),
            ".a:hover, .a:active, .b:hover, .b:active"
        );
    }

    #[test]
    fn replace_has_and_not_lists() {
        assert_eq!(
            replace_nesting_parent("&:has(&, :not(&))", ".foo"),
            ".foo:has(.foo, :not(.foo))"
        );
    }

    #[test]
    fn replace_chained_adjacent_sibling_ampersands() {
        assert_eq!(replace_nesting_parent("&&+&", ".x"), ".x.x+.x");
    }

    #[test]
    fn replace_general_sibling_between_ampersands() {
        assert_eq!(replace_nesting_parent("& ~ &", ".x"), ".x ~ .x");
    }

    #[test]
    fn replace_double_ampersand_compound() {
        assert_eq!(replace_nesting_parent("&&", ".x"), ".x.x");
    }

    #[test]
    fn replace_triple_ampersand_compound() {
        assert_eq!(replace_nesting_parent("&&&", ".x"), ".x.x.x");
    }

    #[test]
    fn replace_compound_tag_suffix() {
        assert_eq!(replace_nesting_parent("&html", ".x"), ".xhtml");
    }

    #[test]
    fn replace_compound_tag_prefix() {
        assert_eq!(replace_nesting_parent("html&", ".x"), "html.x");
    }

    #[test]
    fn replace_compound_then_descendant_ampersand() {
        assert_eq!(replace_nesting_parent("&.b &", ".a"), ".a.b .a");
    }

    #[test]
    fn replace_is_pseudo_with_ampersand() {
        assert_eq!(replace_nesting_parent("&.b :is(&)", ".a"), ".a.b :is(.a)");
    }

    #[test]
    fn replace_double_compound_ampersand() {
        assert_eq!(replace_nesting_parent("&.b&", ".a"), ".a.b.a");
    }

    #[test]
    fn replace_compound_is_pseudo_with_ampersand() {
        assert_eq!(replace_nesting_parent("&.b:is(&)", ".a"), ".a.b:is(.a)");
    }

    #[test]
    fn replace_adjacent_sibling_no_spaces() {
        assert_eq!(replace_nesting_parent("&+&", ".x"), ".x+.x");
    }

    #[test]
    fn replace_compound_tag_list() {
        assert_eq!(replace_selector_parent("&h1, &h2", ".x"), ".xh1, .xh2");
    }

    #[test]
    fn replace_where() {
        assert_eq!(replace_nesting_parent("&:where(h1)", ".x"), ".x:where(h1)");
    }

    #[test]
    fn replace_multi_ampersand_in_one_selector() {
        assert_eq!(
            replace_nesting_parent("& .bar & .baz & .qux", ".x"),
            ".x .bar .x .baz .x .qux"
        );
    }

    #[test]
    fn replace_is_with_inner_compound_ampersand() {
        assert_eq!(
            replace_nesting_parent("&:is(.bar, &.baz)", ".x"),
            ".x:is(.bar, .x.baz)"
        );
    }

    #[test]
    fn replace_not_root_ampersand() {
        assert_eq!(replace_nesting_parent("&:not(&)", ".x"), ".x:not(.x)");
    }

    #[test]
    fn replace_pseudo_element_compound_after() {
        assert_eq!(replace_nesting_parent("&::after", ".x"), ".x::after");
    }

    #[test]
    fn replace_pseudo_element_descendant_after() {
        assert_eq!(replace_nesting_parent("& ::after", ".x"), ".x ::after");
    }

    #[test]
    fn replace_pseudo_element_then_pseudo_class() {
        assert_eq!(
            replace_nesting_parent("&:focus", ".x::before"),
            ".x::before:focus"
        );
    }

    #[test]
    fn replace_pseudo_element_before_after_list() {
        assert_eq!(
            replace_selector_parent("&::before, &::after", ".x"),
            ".x::before, .x::after"
        );
    }

    #[test]
    fn replace_pseudo_element_compound_suffix_before() {
        assert_eq!(replace_nesting_parent("::before&", ".x"), "::before.x");
    }

    #[test]
    fn replace_pseudo_element_single_colon_compound_suffix_before() {
        assert_eq!(replace_nesting_parent(":before&", ".x"), ":before.x");
    }

    #[test]
    fn replace_pseudo_element_descendant_before() {
        assert_eq!(replace_nesting_parent("::before &", ".x"), "::before .x");
    }

    #[test]
    fn replace_tail_ampersand_with_child_combinator() {
        assert_eq!(
            replace_nesting_parent(".something > &", ".x"),
            ".something > .x"
        );
    }

    #[test]
    fn replace_descendant_attr_ampersand_in_string() {
        assert_eq!(
            replace_nesting_parent(r#"& b[a="a&b"]"#, ".x"),
            r#".x b[a="a&b"]"#
        );
    }

    #[test]
    fn replace_compound_combinator_list() {
        assert_eq!(
            replace_selector_parent("&+.baz, &.qux", ".a"),
            ".a+.baz, .a.qux"
        );
    }

    #[test]
    fn replace_child_combinator_no_space() {
        assert_eq!(replace_nesting_parent("&>.bar", ".x"), ".x>.bar");
    }

    #[test]
    fn replace_compound_body_suffix() {
        assert_eq!(replace_nesting_parent("body&", ".x"), "body.x");
    }

    #[test]
    fn replace_compound_class_suffix_no_space() {
        assert_eq!(replace_nesting_parent(".foo&", ".x"), ".foo.x");
    }

    #[test]
    fn replace_standalone_ampersand() {
        assert_eq!(replace_nesting_parent("&", ".x"), ".x");
    }

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
