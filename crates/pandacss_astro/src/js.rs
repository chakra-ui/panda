#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TokenKind {
    Identifier,
    Number,
    String,
    NoSubstitutionTemplate,
    TemplateHead,
    TemplateMiddle,
    TemplateTail,
    Regex,
    Punctuator,
    Eof,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Token {
    pub kind: TokenKind,
    pub start: usize,
    pub end: usize,
}

pub struct Lexer<'a> {
    source: &'a str,
    position: usize,
}

const OPERAND_KEYWORDS: [&str; 14] = [
    "return",
    "typeof",
    "void",
    "delete",
    "await",
    "yield",
    "new",
    "in",
    "of",
    "instanceof",
    "case",
    "else",
    "do",
    "throw",
];

fn is_js_whitespace(ch: char) -> bool {
    matches!(
        ch,
        ' ' | '\t'
            | '\n'
            | '\r'
            | '\u{b}'
            | '\u{c}'
            | '\u{a0}'
            | '\u{feff}'
            | '\u{1680}'
            | '\u{2000}'
            ..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}'
    )
}

fn is_identifier_start(ch: char) -> bool {
    ch.is_ascii_alphabetic()
        || ch == '_'
        || ch == '$'
        || ch == '\\'
        || (!ch.is_ascii() && !is_js_whitespace(ch))
}

fn is_identifier_part(ch: char) -> bool {
    is_identifier_start(ch) || ch.is_ascii_digit()
}

impl<'a> Lexer<'a> {
    #[must_use]
    pub fn new(source: &'a str, position: usize) -> Self {
        let mut lexer = Self {
            source,
            position: 0,
        };
        lexer.set_position(position);
        lexer
    }

    #[must_use]
    pub fn position(&self) -> usize {
        self.position
    }

    pub fn set_position(&mut self, position: usize) {
        let mut position = position.min(self.source.len());
        while !self.source.is_char_boundary(position) {
            position += 1;
        }
        self.position = position;
    }

    pub fn next_token(&mut self, operand: bool) -> Token {
        self.skip_trivia();
        let start = self.position;
        let Some(ch) = self.peek() else {
            return Token {
                kind: TokenKind::Eof,
                start,
                end: start,
            };
        };
        let kind = if is_identifier_start(ch)
            || (ch == '#' && self.peek_at(1).is_some_and(is_identifier_start))
        {
            self.position += ch.len_utf8();
            self.eat_while(is_identifier_part);
            TokenKind::Identifier
        } else if ch.is_ascii_digit()
            || (ch == '.' && self.peek_at(1).is_some_and(|c| c.is_ascii_digit()))
        {
            self.number();
            TokenKind::Number
        } else if ch == '\'' || ch == '"' {
            self.string(ch);
            TokenKind::String
        } else if ch == '`' {
            self.position += 1;
            return self.template(start, TokenKind::TemplateHead);
        } else if ch == '/' && operand {
            self.regex();
            TokenKind::Regex
        } else {
            self.punctuator();
            TokenKind::Punctuator
        };
        Token {
            kind,
            start,
            end: self.position,
        }
    }

    pub fn continue_template(&mut self) -> Token {
        let start = self.position;
        if self.source.as_bytes().get(start) == Some(&b'}') {
            self.position += 1;
        }
        self.template(start, TokenKind::TemplateMiddle)
    }

    fn peek(&self) -> Option<char> {
        self.source[self.position..].chars().next()
    }

    fn peek_at(&self, offset: usize) -> Option<char> {
        self.source.get(self.position + offset..)?.chars().next()
    }

    fn byte(&self, offset: usize) -> Option<u8> {
        self.source.as_bytes().get(self.position + offset).copied()
    }

    fn eat_while(&mut self, predicate: impl Fn(char) -> bool) {
        while let Some(ch) = self.peek() {
            if !predicate(ch) {
                break;
            }
            self.position += ch.len_utf8();
        }
    }

    fn skip_trivia(&mut self) {
        loop {
            self.eat_while(is_js_whitespace);
            match (self.byte(0), self.byte(1)) {
                (Some(b'/'), Some(b'/')) => {
                    let rest = &self.source.as_bytes()[self.position..];
                    self.position += rest.iter().position(|&b| b == b'\n').unwrap_or(rest.len());
                }
                (Some(b'/'), Some(b'*')) => {
                    let rest = &self.source[self.position + 2..];
                    self.position = rest
                        .find("*/")
                        .map_or(self.source.len(), |index| self.position + 2 + index + 2);
                }
                _ => return,
            }
        }
    }

    fn number(&mut self) {
        let bytes = self.source.as_bytes();
        let radix_prefixed = bytes[self.position] == b'0'
            && matches!(self.byte(1), Some(b'x' | b'X' | b'b' | b'B' | b'o' | b'O'));
        let mut seen_dot = false;
        let mut seen_exponent = false;
        while let Some(&byte) = bytes.get(self.position) {
            match byte {
                b'.' if !seen_dot && !seen_exponent && !radix_prefixed => seen_dot = true,
                b'e' | b'E' if !radix_prefixed && !seen_exponent => {
                    seen_exponent = true;
                    if matches!(self.byte(1), Some(b'+' | b'-')) {
                        self.position += 1;
                    }
                }
                b if b.is_ascii_alphanumeric() || b == b'_' => {}
                _ => break,
            }
            self.position += 1;
        }
    }

    fn string(&mut self, quote: char) {
        let bytes = self.source.as_bytes();
        self.position += 1;
        while let Some(&byte) = bytes.get(self.position) {
            self.position += 1;
            if byte == b'\\' {
                self.position += 1;
            } else if byte == quote as u8 {
                break;
            }
        }
        self.clamp();
    }

    fn template(&mut self, start: usize, interpolated: TokenKind) -> Token {
        let bytes = self.source.as_bytes();
        let ended = if interpolated == TokenKind::TemplateHead {
            TokenKind::NoSubstitutionTemplate
        } else {
            TokenKind::TemplateTail
        };
        let mut kind = ended;
        while let Some(&byte) = bytes.get(self.position) {
            self.position += 1;
            match byte {
                b'\\' => self.position += 1,
                b'`' => break,
                b'$' if bytes.get(self.position) == Some(&b'{') => {
                    self.position += 1;
                    kind = interpolated;
                    break;
                }
                _ => {}
            }
        }
        self.clamp();
        Token {
            kind,
            start,
            end: self.position,
        }
    }

    fn regex(&mut self) {
        let bytes = self.source.as_bytes();
        self.position += 1;
        let mut in_class = false;
        while let Some(&byte) = bytes.get(self.position) {
            self.position += 1;
            match byte {
                b'\\' => self.position += 1,
                b'[' => in_class = true,
                b']' => in_class = false,
                b'/' if !in_class => {
                    while bytes
                        .get(self.position)
                        .is_some_and(u8::is_ascii_alphabetic)
                    {
                        self.position += 1;
                    }
                    break;
                }
                _ => {}
            }
        }
        self.clamp();
    }

    fn punctuator(&mut self) {
        let rest = &self.source.as_bytes()[self.position..];
        let length = [
            ">>>=", "...", "===", "!==", "**=", "<<=", ">>=", ">>>", "&&=", "||=", "??=",
        ]
        .iter()
        .chain(
            [
                "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "++", "--", "+=", "-=", "*=",
                "/=", "%=", "&=", "|=", "^=", "<<", ">>", "**",
            ]
            .iter(),
        )
        .find(|candidate| rest.starts_with(candidate.as_bytes()))
        .map_or(1, |candidate| candidate.len());
        let optional_chain_before_digit =
            length == 2 && rest.starts_with(b"?.") && rest.get(2).is_some_and(u8::is_ascii_digit);
        self.position += if optional_chain_before_digit {
            1
        } else {
            length
        };
    }

    fn clamp(&mut self) {
        self.set_position(self.position);
    }
}

#[must_use]
pub fn find_closing_brace(source: &str, open: usize) -> Option<usize> {
    let mut lexer = Lexer::new(source, open + 1);
    let mut depth = 1usize;
    let mut interpolations: Vec<usize> = Vec::new();
    let mut operand = true;
    let mut after_member_dot = false;
    loop {
        let token = lexer.next_token(operand);
        let text = &source[token.start..token.end];
        let mut member_dot = false;
        operand = match token.kind {
            TokenKind::Eof => return None,
            TokenKind::TemplateHead => {
                interpolations.push(depth);
                true
            }
            TokenKind::TemplateMiddle | TokenKind::TemplateTail => {
                unreachable!("only produced by continue_template")
            }
            TokenKind::NoSubstitutionTemplate
            | TokenKind::Number
            | TokenKind::String
            | TokenKind::Regex => false,
            TokenKind::Identifier => !after_member_dot && OPERAND_KEYWORDS.contains(&text),
            TokenKind::Punctuator => match text {
                "{" => {
                    depth += 1;
                    true
                }
                "}" => {
                    if interpolations.last() == Some(&depth) {
                        lexer.set_position(token.start);
                        let piece = lexer.continue_template();
                        if piece.kind == TokenKind::TemplateTail {
                            interpolations.pop();
                            false
                        } else {
                            true
                        }
                    } else {
                        depth -= 1;
                        if depth == 0 {
                            return Some(token.start);
                        }
                        false
                    }
                }
                ")" | "]" => false,
                _ => {
                    member_dot = text == "." || text == "?.";
                    true
                }
            },
        };
        after_member_dot = member_dot;
    }
}
