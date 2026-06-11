/// Backslash-escape CSS identifier tokens the same way the JS `esc` helper does.
#[must_use]
pub fn css_escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut chars = value.char_indices().peekable();
    while let Some((index, ch)) = chars.next() {
        if ch == '\0' {
            out.push('\u{FFFD}');
            continue;
        }
        if is_css_escape_codepoint(ch) {
            push_escaped_codepoint(&mut out, ch);
            continue;
        }
        if index == 0 {
            if ch.is_ascii_digit() {
                push_escaped_codepoint(&mut out, ch);
                continue;
            }
            if ch == '-' {
                if chars.peek().is_some_and(|(_, ch)| ch.is_ascii_digit()) {
                    out.push('-');
                    let (_, digit) = chars.next().expect("peeked leading digit");
                    push_escaped_codepoint(&mut out, digit);
                } else {
                    out.push_str("\\-");
                }
                continue;
            }
        }
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || !ch.is_ascii() {
            out.push(ch);
        } else {
            out.push('\\');
            out.push(ch);
        }
    }
    out
}

fn is_css_escape_codepoint(ch: char) -> bool {
    ch <= '\u{1F}' || ch == '\u{7F}'
}

fn push_escaped_codepoint(out: &mut String, ch: char) {
    use std::fmt::Write as _;
    write!(out, "\\{:x}", ch as u32).expect("writing to String cannot fail");
}
