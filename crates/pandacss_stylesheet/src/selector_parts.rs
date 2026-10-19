//! Top-level parts of a selector list, read the way CSS tokenizes it: escapes,
//! strings, and bracketed blocks belong to the part they sit in, so
//! `.hover\:before` is one class and `[data-x="a,b"]` one attribute.

use std::ops::Range;

use crate::css_syntax::{code_bytes, escape_len, utf8_len};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PartKind<'a> {
    /// `,` between complex selectors.
    Comma,
    /// Descendant whitespace or `>` / `+` / `~`, spanning its whitespace.
    Combinator,
    Id,
    /// `:name` or `:name(args)`. `element` is set for `::name` and the legacy
    /// `:before` / `:after` / `:first-line` / `:first-letter`.
    Pseudo {
        element: bool,
        name: &'a str,
        args: Option<&'a str>,
    },
    /// Type, class, attribute, `*`, or `&`.
    Other,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct Part<'a> {
    pub kind: PartKind<'a>,
    pub span: Range<usize>,
}

const LEGACY_PSEUDO_ELEMENTS: [&str; 4] = ["before", "after", "first-line", "first-letter"];

pub(crate) fn selector_parts(selector: &str) -> SelectorParts<'_> {
    SelectorParts {
        selector,
        pos: 0,
        after_separator: true,
    }
}

pub(crate) struct SelectorParts<'a> {
    selector: &'a str,
    pos: usize,
    /// At the start, or right after a `,` or combinator: whitespace here is
    /// padding, not a descendant combinator.
    after_separator: bool,
}

impl<'a> Iterator for SelectorParts<'a> {
    type Item = Part<'a>;

    fn next(&mut self) -> Option<Part<'a>> {
        let bytes = self.selector.as_bytes();
        let ws_start = self.pos;
        self.pos = skip_whitespace(bytes, self.pos);
        let &byte = bytes.get(self.pos)?;
        let start = self.pos;
        let spaced = start > ws_start;

        let (kind, span_start) = match byte {
            b',' => {
                self.pos += 1;
                (PartKind::Comma, start)
            }
            b'>' | b'+' | b'~' => {
                self.pos = skip_whitespace(bytes, start + 1);
                (PartKind::Combinator, ws_start)
            }
            _ if spaced && !self.after_separator => (PartKind::Combinator, ws_start),
            _ => (self.compound_part(byte), start),
        };
        self.after_separator = matches!(kind, PartKind::Comma | PartKind::Combinator);
        Some(Part {
            kind,
            span: span_start..self.pos,
        })
    }
}

impl<'a> SelectorParts<'a> {
    fn compound_part(&mut self, byte: u8) -> PartKind<'a> {
        let bytes = self.selector.as_bytes();
        let start = self.pos;
        match byte {
            b'#' if bytes
                .get(start + 1)
                .is_some_and(|&next| is_name_byte(next) || next == b'\\') =>
            {
                self.pos = name_end(bytes, start + 1);
                PartKind::Id
            }
            b':' => self.pseudo(),
            b'[' | b'(' => {
                self.pos = block_end(self.selector, start);
                PartKind::Other
            }
            b'\\' => {
                self.pos = name_end(bytes, start);
                PartKind::Other
            }
            _ => {
                self.pos = name_end(bytes, start + utf8_len(byte));
                PartKind::Other
            }
        }
    }

    fn pseudo(&mut self) -> PartKind<'a> {
        let bytes = self.selector.as_bytes();
        let double_colon = bytes.get(self.pos + 1) == Some(&b':');
        let name_start = self.pos + if double_colon { 2 } else { 1 };
        self.pos = name_end(bytes, name_start);
        let name = &self.selector[name_start..self.pos];
        let args = (bytes.get(self.pos) == Some(&b'(')).then(|| {
            let open = self.pos;
            let close = block_close(self.selector, open);
            self.pos = close.map_or(self.selector.len(), |close| close + 1);
            &self.selector[open + 1..close.unwrap_or(self.selector.len())]
        });
        let element = double_colon
            || (args.is_none()
                && LEGACY_PSEUDO_ELEMENTS
                    .iter()
                    .any(|legacy| name.eq_ignore_ascii_case(legacy)));
        PartKind::Pseudo {
            element,
            name,
            args,
        }
    }
}

/// Index just past the block opened at `open`, or the end when it never closes.
fn block_end(selector: &str, open: usize) -> usize {
    block_close(selector, open).map_or(selector.len(), |close| close + 1)
}

/// Index of the `)` / `]` that closes the block opened at `open`.
fn block_close(selector: &str, open: usize) -> Option<usize> {
    let mut depth = 0_u32;
    for (index, byte) in code_bytes(selector, open) {
        match byte {
            b'(' | b'[' => depth += 1,
            b')' | b']' => {
                depth -= 1;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }
    None
}

fn name_end(bytes: &[u8], mut pos: usize) -> usize {
    while let Some(&byte) = bytes.get(pos) {
        if is_name_byte(byte) {
            pos += 1;
        } else if byte == b'\\' {
            pos += escape_len(bytes, pos);
        } else {
            break;
        }
    }
    pos.min(bytes.len())
}

const fn is_name_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_' || !byte.is_ascii()
}

fn skip_whitespace(bytes: &[u8], mut pos: usize) -> usize {
    while bytes.get(pos).is_some_and(u8::is_ascii_whitespace) {
        pos += 1;
    }
    pos
}

#[cfg(test)]
mod tests {
    use insta::assert_yaml_snapshot;

    use super::{PartKind, selector_parts};

    fn parts(selector: &str) -> Vec<String> {
        selector_parts(selector)
            .map(|part| {
                let text = &selector[part.span];
                match part.kind {
                    PartKind::Comma => "comma".to_owned(),
                    PartKind::Combinator => format!("combinator {text:?}"),
                    PartKind::Id => format!("id {text}"),
                    PartKind::Pseudo {
                        element,
                        name,
                        args,
                    } => {
                        let kind = if element {
                            "pseudo-element"
                        } else {
                            "pseudo-class"
                        };
                        match args {
                            Some(args) => format!("{kind} {name} ({args})"),
                            None => format!("{kind} {name}"),
                        }
                    }
                    PartKind::Other => format!("other {text}"),
                }
            })
            .collect()
    }

    #[test]
    fn reads_compound_selector() {
        assert_yaml_snapshot!(parts("a.b#c[d]:hover"), @r#"
        - other a
        - other .b
        - "id #c"
        - "other [d]"
        - pseudo-class hover
        "#);
    }

    #[test]
    fn reads_descendant_combinator() {
        assert_yaml_snapshot!(parts(".a .b"), @r#"
        - other .a
        - "combinator \" \""
        - other .b
        "#);
    }

    #[test]
    fn reads_child_combinator_with_and_without_spaces() {
        assert_yaml_snapshot!(parts(".a > .b>.c"), @r#"
        - other .a
        - "combinator \" > \""
        - other .b
        - "combinator \">\""
        - other .c
        "#);
    }

    #[test]
    fn reads_sibling_combinators() {
        assert_yaml_snapshot!(parts(".a + .b ~ .c"), @r#"
        - other .a
        - "combinator \" + \""
        - other .b
        - "combinator \" ~ \""
        - other .c
        "#);
    }

    #[test]
    fn reads_newline_as_descendant_combinator() {
        assert_yaml_snapshot!(parts(".a\n  .b"), @r#"
        - other .a
        - "combinator \"\\n  \""
        - other .b
        "#);
    }

    #[test]
    fn ignores_padding_around_the_list() {
        assert_yaml_snapshot!(parts("  .a ,  .b  "), @"
        - other .a
        - comma
        - other .b
        ");
    }

    #[test]
    fn reads_pseudo_elements() {
        assert_yaml_snapshot!(parts(".a::before, .b:after, .c::part(label)"), @"
        - other .a
        - pseudo-element before
        - comma
        - other .b
        - pseudo-element after
        - comma
        - other .c
        - pseudo-element part (label)
        ");
    }

    #[test]
    fn reads_legacy_pseudo_element_case_insensitively() {
        assert_yaml_snapshot!(parts(".a:BEFORE"), @"
        - other .a
        - pseudo-element BEFORE
        ");
    }

    #[test]
    fn keeps_mid_word_before_in_the_class() {
        assert_yaml_snapshot!(parts(".beforehand:after-x"), @"
        - other .beforehand
        - pseudo-class after-x
        ");
    }

    #[test]
    fn reads_functional_pseudo_class_arguments() {
        assert_yaml_snapshot!(parts(":is(#a, :where(.b, .c)) :not(.d)"), @r#"
        - "pseudo-class is (#a, :where(.b, .c))"
        - "combinator \" \""
        - pseudo-class not (.d)
        "#);
    }

    #[test]
    fn keeps_combinators_inside_arguments() {
        assert_yaml_snapshot!(parts(".x:has(> .a) .y"), @r#"
        - other .x
        - pseudo-class has (> .a)
        - "combinator \" \""
        - other .y
        "#);
    }

    #[test]
    fn keeps_escaped_colon_in_the_class() {
        assert_yaml_snapshot!(parts(r".hover\:before\:opacity_0\.5:is(:hover, [data-hover])::before"), @r#"
        - "other .hover\\:before\\:opacity_0\\.5"
        - "pseudo-class is (:hover, [data-hover])"
        - pseudo-element before
        "#);
    }

    #[test]
    fn keeps_escaped_quote_in_the_class() {
        assert_yaml_snapshot!(parts(r#".before\:content_\"\"::before"#), @r#"
        - "other .before\\:content_\\\"\\\""
        - pseudo-element before
        "#);
    }

    #[test]
    fn keeps_escaped_comma_in_the_class() {
        assert_yaml_snapshot!(parts(r".animation_fadeIn_1s\,_slideUp_1s, .b"), @r#"
        - "other .animation_fadeIn_1s\\,_slideUp_1s"
        - comma
        - other .b
        "#);
    }

    #[test]
    fn keeps_escaped_hash_in_the_class() {
        assert_yaml_snapshot!(parts(r".c_\#f00"), @r#"- "other .c_\\#f00""#);
    }

    #[test]
    fn keeps_escaped_parens_and_brackets_in_the_class() {
        assert_yaml_snapshot!(parts(r".w_calc\(100\%_-_2px\) .\[\&\>p\]\:mt_2 > p"), @r#"
        - "other .w_calc\\(100\\%_-_2px\\)"
        - "combinator \" \""
        - "other .\\[\\&\\>p\\]\\:mt_2"
        - "combinator \" > \""
        - other p
        "#);
    }

    #[test]
    fn keeps_escaped_combinator_characters_in_the_class() {
        assert_yaml_snapshot!(parts(r".a\>b\+c\~d .e"), @r#"
        - "other .a\\>b\\+c\\~d"
        - "combinator \" \""
        - other .e
        "#);
    }

    #[test]
    fn keeps_escaped_space_in_the_class() {
        assert_yaml_snapshot!(parts(r".a\ b .c"), @r#"
        - "other .a\\ b"
        - "combinator \" \""
        - other .c
        "#);
    }

    #[test]
    fn ends_hex_escape_at_its_whitespace() {
        assert_yaml_snapshot!(parts(r".\31 23 .b"), @r#"
        - "other .\\31 23"
        - "combinator \" \""
        - other .b
        "#);
    }

    #[test]
    fn reads_escaped_id() {
        assert_yaml_snapshot!(parts(r"#\31 a .b"), @r#"
        - "id #\\31 a"
        - "combinator \" \""
        - other .b
        "#);
    }

    #[test]
    fn keeps_escaped_backslash_in_the_class() {
        assert_yaml_snapshot!(parts(r".a\\:hover"), @r#"
        - "other .a\\\\"
        - pseudo-class hover
        "#);
    }

    #[test]
    fn keeps_strings_inside_attribute_selectors() {
        assert_yaml_snapshot!(parts(r#"[data-x="a, b"] [data-y='] ('] [data-z="\""]"#), @r#"
        - "other [data-x=\"a, b\"]"
        - "combinator \" \""
        - "other [data-y='] (']"
        - "combinator \" \""
        - "other [data-z=\"\\\"\"]"
        "#);
    }

    #[test]
    fn treats_hash_inside_attribute_as_value() {
        assert_yaml_snapshot!(parts("[href=#foo]#real"), @r#"
        - "other [href=#foo]"
        - "id #real"
        "#);
    }

    #[test]
    fn reads_unicode_names() {
        assert_yaml_snapshot!(parts(".日本語 #é::before"), @r#"
        - other .日本語
        - "combinator \" \""
        - "id #é"
        - pseudo-element before
        "#);
    }

    #[test]
    fn reads_nesting_and_universal_selectors() {
        assert_yaml_snapshot!(parts("& > *"), @r#"
        - other &
        - "combinator \" > \""
        - other *
        "#);
    }

    #[test]
    fn reads_unclosed_pseudo_arguments_to_the_end() {
        assert_yaml_snapshot!(parts(".a:is(.b, .c"), @r#"
        - other .a
        - "pseudo-class is (.b, .c)"
        "#);
    }

    #[test]
    fn reads_bare_hash_as_other() {
        assert_yaml_snapshot!(parts("a# .b"), @r#"
        - other a
        - "other #"
        - "combinator \" \""
        - other .b
        "#);
    }

    #[test]
    fn reads_trailing_backslash_without_panicking() {
        assert_yaml_snapshot!(parts(r".a\"), @r#"- "other .a\\""#);
    }

    #[test]
    fn reads_empty_selector() {
        assert_yaml_snapshot!(parts(""), @"[]");
    }
}
