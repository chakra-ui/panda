//! Small lexical helpers for CSS fragments handled without a full parser.
//!
//! Callers use these helpers only to locate syntax outside strings and
//! comments. They do not attempt to validate or parse complete CSS.

#[derive(Clone, Copy, Default)]
struct ScanState {
    quote: Option<u8>,
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
        if byte == b'\\' {
            return index + escape_len(bytes, index);
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
        self.quote.is_none() && !self.comment
    }
}

/// Byte length of the escape at `bytes[index]` (`\`): one escaped character,
/// or up to six hex digits plus one optional whitespace terminator.
pub(crate) fn escape_len(bytes: &[u8], index: usize) -> usize {
    let hex = bytes[index + 1..]
        .iter()
        .take(6)
        .take_while(|byte| byte.is_ascii_hexdigit())
        .count();
    if hex == 0 {
        return 1 + bytes.get(index + 1).map_or(0, |&byte| utf8_len(byte));
    }
    let end = index + 1 + hex;
    match bytes.get(end..end + 2) {
        Some(b"\r\n") => 1 + hex + 2,
        _ if bytes
            .get(end)
            .is_some_and(|byte| matches!(byte, b' ' | b'\t' | b'\n' | b'\r' | b'\x0c')) =>
        {
            1 + hex + 1
        }
        _ => 1 + hex,
    }
}

pub(crate) const fn utf8_len(lead: u8) -> usize {
    match lead {
        0xF0.. => 4,
        0xE0.. => 3,
        0xC0.. => 2,
        _ => 1,
    }
}

/// Syntax bytes outside strings, comments, and escapes, from `start` on.
pub(crate) fn code_bytes(input: &str, start: usize) -> impl Iterator<Item = (usize, u8)> + '_ {
    let bytes = input.as_bytes();
    let mut state = ScanState::default();
    let mut index = start;
    std::iter::from_fn(move || {
        while index < bytes.len() {
            let at = index;
            let was_code = state.is_code();
            index = state.advance(bytes, at);
            if was_code && state.is_code() && index == at + 1 {
                return Some((at, bytes[at]));
            }
        }
        None
    })
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
        code_bytes, code_matches, contains_code_byte, contains_multiple_code_bytes,
        contains_top_level_combinator, escape_len, first_code_delimiter, replace_code_byte,
        selector_is_merge_safe, strip_spaced_code_byte, visit_top_level_code_byte,
    };

    fn code_text(input: &str) -> String {
        code_bytes(input, 0)
            .map(|(_, byte)| char::from(byte))
            .collect()
    }

    #[test]
    fn escape_covers_one_escaped_character() {
        assert_eq!(escape_len(br"\:b", 0), 2);
        assert_eq!(escape_len(br"\\b", 0), 2);
    }

    #[test]
    fn escape_covers_a_multibyte_character() {
        assert_eq!(escape_len(r"\éb".as_bytes(), 0), 3);
    }

    #[test]
    fn escape_covers_hex_digits_and_one_whitespace() {
        assert_eq!(escape_len(br"\31 a", 0), 4);
        assert_eq!(escape_len(br"\31  a", 0), 4);
        assert_eq!(escape_len(b"\\31\ta", 0), 4);
        assert_eq!(escape_len(b"\\31\r\na", 0), 5);
        assert_eq!(escape_len(br"\31a", 0), 4);
    }

    #[test]
    fn escape_stops_after_six_hex_digits() {
        assert_eq!(escape_len(br"\0000311", 0), 7);
    }

    #[test]
    fn escape_at_the_end_covers_the_backslash() {
        assert_eq!(escape_len(br"\", 0), 1);
    }

    #[test]
    fn code_bytes_skip_escapes() {
        assert_eq!(code_text(r".a\:b\,c:d"), ".abc:d");
    }

    #[test]
    fn code_bytes_skip_hex_escape_terminator() {
        assert_eq!(code_text(r".\31 0 .b"), ".0 .b");
    }

    #[test]
    fn code_bytes_skip_strings_and_comments() {
        assert_eq!(code_text(r#"[a="x,y"] /* , */ ,"#), "[a=]  ,");
    }

    #[test]
    fn code_bytes_skip_escaped_quotes_inside_strings() {
        assert_eq!(code_text(r#"[a="x\"y"],b"#), "[a=],b");
    }

    #[test]
    fn code_bytes_do_not_open_a_string_on_an_escaped_quote() {
        assert_eq!(code_text(r#".a\"b, .c"#), ".ab, .c");
    }

    #[test]
    fn code_bytes_start_mid_input() {
        let indices: Vec<usize> = code_bytes(".a(.b)", 2).map(|(index, _)| index).collect();
        assert_eq!(indices, vec![2, 3, 4, 5]);
    }

    #[test]
    fn scanner_helpers_ignore_hex_escape_terminator() {
        assert!(!contains_top_level_combinator(r".\31 0"));
        assert!(contains_top_level_combinator(r".\31 0 .b"));
    }

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
