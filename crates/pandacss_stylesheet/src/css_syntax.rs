//! Small lexical helpers for CSS fragments handled without a full parser.
//!
//! Callers use these helpers only to locate syntax outside strings and
//! comments. They do not attempt to validate or parse complete CSS.

#[derive(Clone, Copy, Default)]
struct ScanState {
    quote: Option<u8>,
    escaped: bool,
    comment: bool,
}

impl ScanState {
    fn advance(&mut self, bytes: &[u8], index: usize) -> usize {
        let byte = bytes[index];
        if self.comment {
            if byte == b'*' && bytes.get(index + 1) == Some(&b'/') {
                self.comment = false;
                return index + 2;
            }
            return index + 1;
        }
        if self.escaped {
            self.escaped = false;
            return index + 1;
        }
        if byte == b'\\' {
            self.escaped = true;
            return index + 1;
        }
        if let Some(quote) = self.quote {
            if byte == quote {
                self.quote = None;
            }
            return index + 1;
        }
        if byte == b'/' && bytes.get(index + 1) == Some(&b'*') {
            self.comment = true;
            return index + 2;
        }
        if matches!(byte, b'\'' | b'"') {
            self.quote = Some(byte);
        }
        index + 1
    }

    const fn is_code(self) -> bool {
        self.quote.is_none() && !self.comment && !self.escaped
    }
}

/// Byte offsets where `needle` starts outside CSS strings and comments.
pub(crate) fn code_matches(input: &str, needle: &str) -> Vec<usize> {
    if needle.is_empty() {
        return Vec::new();
    }
    let bytes = input.as_bytes();
    let needle = needle.as_bytes();
    let mut state = ScanState::default();
    let mut matches = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() && bytes[index..].starts_with(needle) {
            matches.push(index);
            index += needle.len();
            continue;
        }
        index = state.advance(bytes, index);
    }
    matches
}

pub(crate) fn contains_code_byte(input: &str, target: u8) -> bool {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() && bytes[index] == target {
            return true;
        }
        index = state.advance(bytes, index);
    }
    false
}

pub(crate) fn contains_multiple_code_bytes(input: &str, target: u8) -> bool {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut found = false;
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() && bytes[index] == target {
            if found {
                return true;
            }
            found = true;
        }
        index = state.advance(bytes, index);
    }
    false
}

pub(crate) fn contains_top_level_combinator(input: &str) -> bool {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut depth = 0u32;
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() {
            match bytes[index] {
                b'(' | b'[' => depth += 1,
                b')' | b']' => depth = depth.saturating_sub(1),
                b'>' | b'+' | b'~' if depth == 0 => return true,
                byte if byte.is_ascii_whitespace() && depth == 0 => return true,
                _ => {}
            }
        }
        index = state.advance(bytes, index);
    }
    false
}

/// Replace syntax bytes outside strings/comments while preserving every other
/// byte verbatim.
pub(crate) fn replace_code_byte(input: &str, target: u8, replacement: &str) -> String {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut output = String::with_capacity(input.len() + replacement.len());
    let mut copied_until = 0;
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() && bytes[index] == target {
            output.push_str(&input[copied_until..index]);
            output.push_str(replacement);
            index += 1;
            copied_until = index;
            continue;
        }
        index = state.advance(bytes, index);
    }
    output.push_str(&input[copied_until..]);
    output
}

pub(crate) fn visit_top_level_code_byte(input: &str, target: u8, mut visit: impl FnMut(usize)) {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut depth = 0u32;
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() {
            match bytes[index] {
                b'(' | b'[' => depth += 1,
                b')' | b']' => depth = depth.saturating_sub(1),
                byte if byte == target && depth == 0 => visit(index),
                _ => {}
            }
        }
        index = state.advance(bytes, index);
    }
}

pub(crate) fn code_depth_zero_at(input: &str, target_index: usize) -> bool {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut depth = 0u32;
    let mut index = 0;
    while index < target_index && index < bytes.len() {
        if state.is_code() {
            match bytes[index] {
                b'(' | b'[' => depth += 1,
                b')' | b']' => depth = depth.saturating_sub(1),
                _ => {}
            }
        }
        let next = state.advance(bytes, index);
        if next > target_index {
            return false;
        }
        index = next;
    }
    index == target_index && state.is_code() && depth == 0
}

/// Whether a selector can safely share a comma-separated rule with baseline
/// selectors. Unsupported pseudo syntax invalidates an entire selector list.
pub(crate) fn selector_is_merge_safe(input: &str) -> bool {
    fn starts_with_ignore_ascii_case(input: &[u8], needle: &[u8]) -> bool {
        input
            .get(..needle.len())
            .is_some_and(|prefix| prefix.eq_ignore_ascii_case(needle))
    }

    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() && bytes[index] == b':' {
            let suffix = &bytes[index + 1..];
            if suffix.starts_with(b":")
                || suffix.starts_with(b"-")
                || starts_with_ignore_ascii_case(suffix, b"has(")
                || starts_with_ignore_ascii_case(suffix, b"host(")
                || starts_with_ignore_ascii_case(suffix, b"host-context(")
                || starts_with_ignore_ascii_case(suffix, b"state(")
                || starts_with_ignore_ascii_case(suffix, b"nth-child(")
                || starts_with_ignore_ascii_case(suffix, b"nth-last-child(")
                || starts_with_ignore_ascii_case(suffix, b"before")
                || starts_with_ignore_ascii_case(suffix, b"after")
                || starts_with_ignore_ascii_case(suffix, b"first-line")
                || starts_with_ignore_ascii_case(suffix, b"first-letter")
            {
                return false;
            }
        }
        index = state.advance(bytes, index);
    }
    true
}

/// Remove nesting-parent markers that are preceded by CSS whitespace.
/// Returns `None` when no such marker occurs outside strings/comments.
pub(crate) fn strip_spaced_code_byte(input: &str, target: u8) -> Option<String> {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut out = None;
    let mut copied_until = 0;
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code()
            && bytes[index] == target
            && index > 0
            && bytes[index - 1].is_ascii_whitespace()
        {
            let mut whitespace_start = index;
            while whitespace_start > copied_until
                && bytes[whitespace_start - 1].is_ascii_whitespace()
            {
                whitespace_start -= 1;
            }
            let output = out.get_or_insert_with(|| String::with_capacity(input.len()));
            output.push_str(&input[copied_until..whitespace_start]);
            copied_until = index + 1;
        }
        index = state.advance(bytes, index);
    }
    out.map(|mut output| {
        output.push_str(&input[copied_until..]);
        output.truncate(output.trim_end().len());
        output
    })
}

/// First matching delimiter outside strings and comments.
pub(crate) fn first_code_delimiter(input: &str, delimiters: &[u8]) -> Option<(usize, u8)> {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut index = 0;
    while index < bytes.len() {
        if state.is_code() && delimiters.contains(&bytes[index]) {
            return Some((index, bytes[index]));
        }
        index = state.advance(bytes, index);
    }
    None
}

#[cfg(test)]
mod tests {
    use insta::assert_yaml_snapshot;

    use super::{
        code_matches, contains_code_byte, contains_multiple_code_bytes,
        contains_top_level_combinator, first_code_delimiter, replace_code_byte,
        selector_is_merge_safe, strip_spaced_code_byte, visit_top_level_code_byte,
    };

    #[test]
    fn ignores_strings_comments_and_escapes() {
        let css = r"&[data-value='&'] /* & */ [data-value=\&]";
        assert_yaml_snapshot!(serde_json::json!({
            "matches": code_matches(css, "&"),
            "contains": contains_code_byte(css, b'&'),
        }), @r#"
        matches:
          - 0
        contains: true
        "#);
    }

    #[test]
    fn finds_nested_function_names_without_reading_strings() {
        let css = r#"var(--outer, var(--inner, "var(--quoted)"))"#;
        assert_yaml_snapshot!(code_matches(css, "var("), @r"
        - 0
        - 13
        ");
    }

    #[test]
    fn delimiter_scan_ignores_quoted_delimiters() {
        let delimiter = first_code_delimiter(r#"";" { value }"#, b";{")
            .map(|(index, byte)| (index, char::from(byte).to_string()));
        assert_yaml_snapshot!(delimiter, @r#"
        - 4
        - "{"
        "#);
    }

    #[test]
    fn strips_only_unquoted_spaced_parent_markers() {
        assert_yaml_snapshot!(serde_json::json!({
            "codeMarker": strip_spaced_code_byte(r#"[data-label="sound & vision"] .dark &"#, b'&'),
            "quotedMarkerOnly": strip_spaced_code_byte(r#"[data-label="sound & vision"]"#, b'&'),
        }), @r#"
        codeMarker: "[data-label=\"sound & vision\"] .dark"
        quotedMarkerOnly: ~
        "#);
    }

    #[test]
    fn selector_scans_ignore_comments() {
        let mut commas = Vec::new();
        visit_top_level_code_byte(".a/* , */,.b:is(.c,.d)", b',', |index| {
            commas.push(index);
        });
        assert_yaml_snapshot!(serde_json::json!({
            "multipleAmpersands": contains_multiple_code_bytes("&/* & */", b'&'),
            "commentCombinator": contains_top_level_combinator(".a/* > */.b"),
            "codeCombinator": contains_top_level_combinator(".a/* > */ .b"),
            "replacement": replace_code_byte("&/* preserve & */", b'&', ".a"),
            "topLevelCommas": commas,
        }), @r#"
        multipleAmpersands: false
        commentCombinator: false
        codeCombinator: true
        replacement: ".a/* preserve & */"
        topLevelCommas:
          - 9
        "#);
    }

    #[test]
    fn merge_safety_isolates_feature_and_pseudo_element_selectors() {
        let selectors = [
            ".c:hover",
            ".c:is(:hover, [data-hover])",
            ".c:has(.child)",
            ".c::-webkit-slider-thumb",
            ".c:before",
            r".escaped\:has\(x\)",
        ];
        assert_yaml_snapshot!(
            selectors
                .into_iter()
                .map(|selector| (selector, selector_is_merge_safe(selector)))
                .collect::<Vec<_>>(),
            @r#"
        - - ".c:hover"
          - true
        - - ".c:is(:hover, [data-hover])"
          - true
        - - ".c:has(.child)"
          - false
        - - ".c::-webkit-slider-thumb"
          - false
        - - ".c:before"
          - false
        - - ".escaped\\:has\\(x\\)"
          - true
        "#
        );
    }
}
