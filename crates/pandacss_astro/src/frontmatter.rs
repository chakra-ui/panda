use std::ops::Range;

pub(crate) struct Frontmatter {
    pub(crate) content: Range<usize>,
    pub(crate) close: usize,
    pub(crate) body: usize,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum State {
    Normal,
    SingleQuote,
    DoubleQuote,
    Template,
    Line,
    Block,
    Regex,
    Class,
}

pub(crate) fn scan(source: &str) -> Option<Frontmatter> {
    let bytes = source.as_bytes();
    let open = find_opening_fence(bytes)?;
    let start = open + 3;
    let close = find_closing_fence(bytes, start)?;
    let after = close + 3;
    let body = match bytes.get(after) {
        Some(b'\n') => after + 1,
        Some(b'\r') if bytes.get(after + 1) == Some(&b'\n') => after + 2,
        _ => after,
    };
    Some(Frontmatter {
        content: start..close,
        close,
        body,
    })
}

fn find_opening_fence(bytes: &[u8]) -> Option<usize> {
    let mut dashes = 0;
    for (index, &byte) in bytes.iter().enumerate() {
        match byte {
            b'-' => {
                dashes += 1;
                if dashes == 3 {
                    return Some(index - 2);
                }
            }
            b'<' | b'{' | b'}' => return None,
            _ => dashes = 0,
        }
    }
    None
}

#[allow(
    clippy::too_many_lines,
    reason = "single flat state machine mirrors the fork"
)]
fn find_closing_fence(bytes: &[u8], start: usize) -> Option<usize> {
    let len = bytes.len();
    let mut state = State::Normal;
    let mut regex_allowed = true;
    let mut i = start;
    while i < len {
        let byte = bytes[i];
        let next = bytes.get(i + 1).copied();
        match state {
            State::Normal => match byte {
                b'-' if next == Some(b'-') && bytes.get(i + 2) == Some(&b'-') => return Some(i),
                b'\'' => {
                    state = State::SingleQuote;
                    regex_allowed = true;
                }
                b'"' => {
                    state = State::DoubleQuote;
                    regex_allowed = true;
                }
                b'`' => {
                    state = State::Template;
                    regex_allowed = true;
                }
                b'/' if next == Some(b'/') => {
                    state = State::Line;
                    i += 1;
                }
                b'/' if next == Some(b'*') => {
                    state = State::Block;
                    i += 1;
                }
                b'/' if regex_allowed => state = State::Regex,
                b')' | b']' => regex_allowed = false,
                b' ' | b'\t' => {}
                b if b.is_ascii_alphanumeric() || b == b'_' || b == b'$' => regex_allowed = false,
                _ => regex_allowed = true,
            },
            State::SingleQuote | State::DoubleQuote => {
                let quote = if state == State::SingleQuote {
                    b'\''
                } else {
                    b'"'
                };
                if byte == b'\\' {
                    i += 1;
                } else if byte == quote {
                    state = State::Normal;
                    regex_allowed = false;
                } else if byte == b'\n' || byte == b'\r' {
                    state = State::Normal;
                    regex_allowed = true;
                }
            }
            State::Template => {
                if byte == b'\\' {
                    i += 1;
                } else if byte == b'`' {
                    state = State::Normal;
                    regex_allowed = false;
                }
            }
            State::Line => {
                if byte == b'\n' {
                    state = State::Normal;
                    regex_allowed = true;
                }
            }
            State::Block => {
                if byte == b'*' && next == Some(b'/') {
                    state = State::Normal;
                    i += 1;
                }
            }
            State::Regex => match byte {
                b'\\' => i += 1,
                b'[' => state = State::Class,
                b'/' => {
                    state = State::Normal;
                    regex_allowed = false;
                    while bytes.get(i + 1).is_some_and(u8::is_ascii_alphabetic) {
                        i += 1;
                    }
                }
                b'\n' | b'\r' => {
                    state = State::Normal;
                    regex_allowed = true;
                }
                _ => {}
            },
            State::Class => match byte {
                b'\\' => i += 1,
                b']' => state = State::Regex,
                b'\n' | b'\r' => {
                    state = State::Normal;
                    regex_allowed = true;
                }
                _ => {}
            },
        }
        i += 1;
    }
    None
}

#[cfg(test)]
mod tests {
    use super::scan;

    fn fences(source: &str) -> Option<(std::ops::Range<usize>, usize, usize)> {
        scan(source).map(|frontmatter| (frontmatter.content, frontmatter.close, frontmatter.body))
    }

    #[test]
    fn content_before_the_fence_and_code_on_the_fence_lines() {
        assert_eq!(fences("x ---\na\n--- y\n<p>"), Some((5..8, 8, 11)));
        assert_eq!(fences("---a---<p/>"), Some((3..4, 4, 7)));
        assert_eq!(fences("a --- b\n<p>c --- d</p>"), Some((5..13, 13, 16)));
    }

    #[test]
    fn dash_runs() {
        assert_eq!(fences("------\n<p/>"), Some((3..3, 3, 7)));
        assert_eq!(fences("-----\n<p/>"), None);
    }

    #[test]
    fn no_frontmatter_when_markup_comes_first_or_the_fence_is_unclosed() {
        assert_eq!(fences("<p>\n---\nx\n---"), None);
        assert_eq!(fences("{x}\n---\nx\n---"), None);
        assert_eq!(fences("---\nconst a = 1\n<div/>"), None);
    }

    #[test]
    fn strings_templates_comments_and_regexes_hide_dashes() {
        assert_eq!(
            fences("---\nconst s = `---`;\n---\n"),
            Some((3..21, 21, 25))
        );
        assert_eq!(
            fences("---\nconst s = '---';\n---\n"),
            Some((3..21, 21, 25))
        );
        assert_eq!(fences("---\n/* --- */\n---\n"), Some((3..14, 14, 18)));
        assert_eq!(fences("---\n// ---\n---\n"), Some((3..11, 11, 15)));
        assert_eq!(fences("---\nb\n/---/\n---\n"), Some((3..12, 12, 16)));
    }

    #[test]
    fn coarse_cases_match_the_fork() {
        assert_eq!(
            fences("---\nif (x) /---/.test(y)\n---\n").map(|f| f.1),
            Some(12)
        );
        assert_eq!(fences("---\nlet a = 1; a---\n").map(|f| f.1), Some(16));
        assert_eq!(
            fences("---\nconst t = `${`---`}`;\n---\n").map(|f| f.1),
            Some(18)
        );
    }

    #[test]
    fn lone_carriage_return_after_the_fence_is_body_text() {
        assert_eq!(fences("---\n---\r<p/>"), Some((3..4, 4, 7)));
        assert_eq!(fences("---\n---\r\n<p/>"), Some((3..4, 4, 9)));
    }
}
