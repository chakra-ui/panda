mod expression;
mod tag;

use std::ops::Range;

use crate::AstroDiagnostic;
use crate::frontmatter;
use crate::js::{Lexer, Token, TokenKind};
use crate::lower::offset;
use crate::tree::{Child, ChildKind, Document, Element, Fragment, Markup};

pub(crate) fn parse(source: &str) -> Document {
    let frontmatter = frontmatter::scan(source);
    let start = frontmatter
        .as_ref()
        .map_or(0, |frontmatter| frontmatter.body);
    let mut parser = Parser {
        source,
        bytes: source.as_bytes(),
        diagnostics: Vec::new(),
        open: Vec::new(),
        foreign: false,
        depth: 0,
        comment_close: None,
    };
    let body = parser.body(start);
    Document {
        frontmatter,
        body,
        diagnostics: parser.diagnostics,
    }
}

struct Fatal;

type Parse<T> = Result<T, Fatal>;

#[derive(Clone, Copy, PartialEq, Eq)]
enum Next {
    Child,
    Foreign,
    Js,
    Stuck,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Kind {
    Angle,
    OpenBrace,
    CloseBrace,
    Text,
    Junk,
    Eof,
}

#[derive(Clone, Copy)]
struct Lexed {
    kind: Kind,
    start: usize,
    end: usize,
}

struct Parsed {
    markup: Markup,
    end: usize,
    next: Next,
}

impl Parsed {
    fn into_child(self) -> Child {
        into_child(self.markup)
    }
}

fn into_child(markup: Markup) -> Child {
    match markup {
        Markup::Element { span, element } => Child {
            start: span.start,
            kind: ChildKind::Element(element),
        },
        Markup::Fragment(fragment) => Child {
            start: fragment.span.start,
            kind: ChildKind::Fragment(fragment),
        },
    }
}

enum Mode {
    Child(Next),
    Drift,
}

struct Parser<'s> {
    source: &'s str,
    bytes: &'s [u8],
    diagnostics: Vec<AstroDiagnostic>,
    open: Vec<Range<usize>>,
    foreign: bool,
    depth: usize,
    comment_close: Option<(usize, Option<usize>)>,
}

const MAX_DEPTH: usize = 256;

impl Parser<'_> {
    fn body(&mut self, start: usize) -> Vec<Child> {
        let mut children = Vec::new();
        let mut pos = start;
        let mut mode = Mode::Child(Next::Child);
        loop {
            let token = match mode {
                Mode::Child(next) => self.read(pos, next),
                Mode::Drift => match self.drift(pos) {
                    Some(token) => token,
                    None => break,
                },
            };
            mode = Mode::Child(Next::Child);
            match token.kind {
                Kind::Eof | Kind::Junk => break,
                Kind::Text => {
                    children.push(other(token.start));
                    pos = token.end;
                }
                Kind::CloseBrace => {
                    pos = token.end;
                    mode = Mode::Drift;
                }
                Kind::OpenBrace => match self.container(token.start) {
                    Ok((child, end)) => {
                        children.push(child);
                        pos = end;
                    }
                    Err(Fatal) => break,
                },
                Kind::Angle => match self.top_angle(token.start) {
                    Ok(Top::Child(parsed)) => {
                        pos = parsed.end;
                        mode = Mode::Child(parsed.next);
                        children.push(parsed.into_child());
                    }
                    Ok(Top::Other(end)) => {
                        children.push(other(token.start));
                        pos = end;
                    }
                    Ok(Top::Drift(end)) => {
                        pos = end;
                        mode = Mode::Drift;
                    }
                    Ok(Top::End) | Err(Fatal) => break,
                },
            }
        }
        children
    }

    fn top_angle(&mut self, lt: usize) -> Parse<Top> {
        let after = self.token(lt + 1);
        match self.byte(after.start) {
            None => Err(self.eof()),
            Some(b'/' | b'!') if after.end != after.start + 1 => {
                Err(self.unexpected(after.start..after.end))
            }
            Some(b'/') => Ok(Top::End),
            Some(b'!') => Ok(self.top_bang(after.start)),
            Some(b'>') => {
                let fragment = self.fragment(lt, after.start + 1)?;
                Ok(Top::Child(fragment))
            }
            _ if after.kind == TokenKind::Identifier => {
                let rest = &self.bytes[after.start..];
                let script = rest.starts_with(b"script")
                    && matches!(
                        rest.get(6),
                        None | Some(b' ' | b'>' | b'/' | b'\n' | b'\r' | b'\t')
                    );
                let parsed = if script {
                    self.script(lt, after.start, true)?
                } else {
                    self.element(lt, after)?
                };
                Ok(Top::Child(parsed))
            }
            _ => Err(self.unexpected(after.start..after.end)),
        }
    }

    fn top_bang(&mut self, bang: usize) -> Top {
        if let Some(end) = self.comment(bang) {
            return Top::Other(end);
        }
        let rest = &self.bytes[bang..];
        if !rest.starts_with(b"!--")
            && let Some(index) = rest.iter().position(|&byte| byte == b'>')
        {
            return Top::Other(bang + index + 1);
        }
        let mut pos = bang;
        loop {
            let token = self.token(pos);
            if self.lex_error(pos, token) {
                return Top::End;
            }
            if self.byte(token.start) == Some(b'>') {
                return Top::Drift(token.start + 1);
            }
            pos = token.end;
        }
    }

    fn drift(&mut self, start: usize) -> Option<Lexed> {
        let mut pos = start;
        loop {
            let token = self.token(pos);
            if self.lex_error(pos, token) {
                return None;
            }
            let text = &self.source[token.start..token.end];
            if token.kind == TokenKind::Punctuator && text == "<" {
                return Some(lexed(Kind::Angle, token.start, token.end));
            }
            if token.kind == TokenKind::Punctuator && text == "{" {
                return Some(lexed(Kind::OpenBrace, token.start, token.end));
            }
            pos = token.end;
        }
    }

    fn lex_error(&mut self, pos: usize, token: Token) -> bool {
        let text = &self.source[token.start..token.end];
        let message = match token.kind {
            TokenKind::Eof => {
                if let Some(comment) = self.open_comment(pos) {
                    let end = self.bytes.len();
                    self.diagnostics
                        .push(diagnostic("Unterminated comment", comment..end));
                }
                return true;
            }
            TokenKind::String if !terminated(text) => "Unterminated string",
            TokenKind::NoSubstitutionTemplate if !terminated(text) => "Unterminated template",
            TokenKind::Number if !tag::valid_number(text) || self.word_follows(token.end) => {
                self.diagnostics.push(diagnostic(
                    "Invalid characters after number",
                    token.start..token.end,
                ));
                return true;
            }
            _ => return token.end <= pos,
        };
        self.diagnostics
            .push(diagnostic(message, token.start..token.end));
        token.end <= pos
    }

    fn word_follows(&self, pos: usize) -> bool {
        self.source
            .get(pos..)
            .and_then(|rest| rest.chars().next())
            .is_some_and(|ch| {
                ch == '_'
                    || ch == '$'
                    || ch == '\\'
                    || (!ch.is_ascii() && !ch.is_whitespace() && ch != '\u{feff}')
            })
    }

    fn open_comment(&self, start: usize) -> Option<usize> {
        let mut pos = start;
        loop {
            let rest = self.source.get(pos..)?;
            let trimmed =
                rest.trim_start_matches(|ch: char| ch.is_whitespace() || ch == '\u{feff}');
            pos += rest.len() - trimmed.len();
            if trimmed.starts_with("//") {
                pos += trimmed.find('\n').unwrap_or(trimmed.len());
            } else if let Some(body) = trimmed.strip_prefix("/*") {
                match body.find("*/") {
                    Some(index) => pos += index + 4,
                    None => return Some(pos),
                }
            } else {
                return None;
            }
        }
    }

    fn nested<T>(&mut self, at: usize, parse: impl FnOnce(&mut Self) -> Parse<T>) -> Parse<T> {
        if self.depth >= MAX_DEPTH {
            let end = (at + 1).min(self.bytes.len());
            self.diagnostics
                .push(diagnostic("Nesting too deep", at.min(end)..end));
            return Err(Fatal);
        }
        self.depth += 1;
        let result = parse(self);
        self.depth -= 1;
        result
    }

    fn read(&self, pos: usize, next: Next) -> Lexed {
        match next {
            Next::Child | Next::Stuck => self.child_token(pos, self.foreign),
            Next::Foreign => self.child_token(pos, true),
            Next::Js => {
                let token = self.token(pos);
                let kind = match self.byte(token.start) {
                    None => Kind::Eof,
                    Some(b'<') if token.end == token.start + 1 => Kind::Angle,
                    Some(b'{') => Kind::OpenBrace,
                    Some(b'}') => Kind::CloseBrace,
                    _ => Kind::Junk,
                };
                lexed(kind, token.start, token.end)
            }
        }
    }

    fn child_token(&self, pos: usize, foreign: bool) -> Lexed {
        match self.byte(pos) {
            None => lexed(Kind::Eof, pos, pos),
            Some(b'<') if self.markup_angle(pos) => lexed(Kind::Angle, pos, pos + 1),
            Some(b'<') => lexed(Kind::Text, pos, self.text_end(pos + 1, foreign, true)),
            Some(b'{') if !foreign => lexed(Kind::OpenBrace, pos, pos + 1),
            Some(b'}') if !foreign => lexed(Kind::CloseBrace, pos, pos + 1),
            Some(_) => lexed(Kind::Text, pos, self.text_end(pos, foreign, false)),
        }
    }

    fn markup_angle(&self, lt: usize) -> bool {
        match self.byte(lt + 1) {
            None => true,
            Some(byte) => byte.is_ascii_alphabetic() || matches!(byte, b'/' | b'>' | b'!'),
        }
    }

    fn text_end(&self, start: usize, foreign: bool, valid_angle_only: bool) -> usize {
        let mut pos = start;
        while let Some(&byte) = self.bytes.get(pos) {
            match byte {
                b'<' if !valid_angle_only || self.markup_angle(pos) => return pos,
                b'{' | b'}' if !foreign || valid_angle_only => return pos,
                _ => pos += 1,
            }
        }
        pos
    }

    fn token(&self, pos: usize) -> Token {
        Lexer::new(self.source, pos).next_token(false)
    }

    fn byte(&self, pos: usize) -> Option<u8> {
        self.bytes.get(pos).copied()
    }

    fn eof(&mut self) -> Fatal {
        let end = self.bytes.len();
        self.diagnostics
            .push(diagnostic("Unexpected end of file", end..end));
        Fatal
    }

    fn unexpected(&mut self, span: Range<usize>) -> Fatal {
        if span.start >= self.bytes.len() {
            return self.eof();
        }
        self.diagnostics.push(diagnostic("Unexpected token", span));
        Fatal
    }
}

enum Top {
    Child(Parsed),
    Other(usize),
    Drift(usize),
    End,
}

fn lexed(kind: Kind, start: usize, end: usize) -> Lexed {
    Lexed { kind, start, end }
}

fn other(start: usize) -> Child {
    Child {
        start,
        kind: ChildKind::Other,
    }
}

fn terminated(text: &str) -> bool {
    let bytes = text.as_bytes();
    bytes.len() >= 2 && bytes.first() == bytes.last()
}

fn diagnostic(message: &str, span: Range<usize>) -> AstroDiagnostic {
    AstroDiagnostic {
        message: message.to_owned(),
        span: Some(offset(span.start)..offset(span.end)),
    }
}

fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

fn element_markup(span: Range<usize>, element: Element) -> Markup {
    Markup::Element { span, element }
}

fn fragment_markup(span: Range<usize>, children: Vec<Child>) -> Markup {
    Markup::Fragment(Fragment { span, children })
}
