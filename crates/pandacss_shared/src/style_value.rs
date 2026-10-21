//! Whitespace rules shared by the compiler and the generated runtime's `sanitizeStyleValue`,
//! so a value's class name is the same at build time and in the browser.

use std::borrow::Cow;

/// Characters JS `\s` matches. Rust's `char::is_whitespace` differs on U+0085 and U+FEFF.
#[must_use]
pub fn is_js_whitespace(ch: char) -> bool {
    matches!(
        ch,
        '\t' | '\n' | '\u{b}' | '\u{c}' | '\r' | ' ' | '\u{a0}' | '\u{1680}' | '\u{2000}'
            ..='\u{200a}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202f}'
                | '\u{205f}'
                | '\u{3000}'
                | '\u{feff}'
    )
}

/// Collapses each whitespace run to one space, except inside quotes, where `content` and
/// `grid-template-areas` text is kept as written.
#[must_use]
pub fn sanitize_style_value(value: &str) -> Cow<'_, str> {
    if !needs_sanitizing(value) {
        return Cow::Borrowed(value);
    }

    let mut out = String::with_capacity(value.len());
    let mut quote: Option<char> = None;
    let mut after_space = false;
    for ch in value.chars() {
        if let Some(open) = quote {
            out.push(ch);
            if ch == open {
                quote = None;
            }
        } else if ch == '"' || ch == '\'' {
            quote = Some(ch);
            out.push(ch);
            after_space = false;
        } else if is_js_whitespace(ch) {
            if !after_space {
                out.push(' ');
                after_space = true;
            }
        } else {
            out.push(ch);
            after_space = false;
        }
    }
    Cow::Owned(out)
}

fn needs_sanitizing(value: &str) -> bool {
    let mut previous_space = false;
    let mut quoted = false;
    for ch in value.chars() {
        if ch == '"' || ch == '\'' {
            quoted = true;
        }
        if is_js_whitespace(ch) {
            if quoted || previous_space || ch != ' ' {
                return true;
            }
            previous_space = true;
        } else {
            previous_space = false;
        }
    }
    false
}
