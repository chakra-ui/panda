use super::{Fatal, Kind, Next, Parse, Parser, diagnostic, find, into_child, lexed, other};
use crate::js::{Lexer, TokenKind, regex_terminated, string_terminated};
use crate::tree::{Child, ChildKind, Expression, Fragment, Markup};

#[derive(Clone, Copy, PartialEq, Eq)]
enum Frame {
    Paren { control: bool },
    Bracket,
    Brace { block: bool },
    Interpolation,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Prev {
    Start,
    CloseParen,
    Arrow,
    Semicolon,
    BlockOpen,
    BlockClose,
    Keyword,
    Comma,
    Other,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Pending {
    Nothing,
    Member,
    Control,
    Unary,
    Markup,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Until {
    Brace,
    Template,
}

enum Entry {
    Markup(Markup),
    Child(Child),
    Text { start: usize, blank: bool },
}

struct Scan {
    stack: Vec<Frame>,
    operand: bool,
    prev: Prev,
    pending: Pending,
    first: Option<usize>,
    last: usize,
    markup: Vec<Markup>,
}

impl Scan {
    fn expression(self, end: usize) -> Expression {
        let span = match self.first {
            Some(first) => first..self.last,
            None => end..end,
        };
        Expression {
            span,
            markup: self.markup,
        }
    }
}

impl<'s> Parser<'s> {
    pub(super) fn container(&mut self, open: usize) -> Parse<(Child, usize)> {
        self.nested(open, |this| this.container_at(open))
    }

    fn container_at(&mut self, open: usize) -> Parse<(Child, usize)> {
        let first = Lexer::new(self.source, open + 1).next_token(true);
        if &self.source[first.start..first.end] == "..." {
            let (expression, close) = self.js_expression(first.end)?;
            if expression.span.is_empty() {
                return Err(self.unexpected(close..close + 1));
            }
            let child = Child {
                start: open,
                kind: ChildKind::Spread(expression),
            };
            return Ok((child, close + 1));
        }
        match self.byte(first.start) {
            Some(b'<') => self.markup_first(open, first.start),
            Some(b'}') => Ok((other(open), first.end)),
            _ => {
                let (expression, close) = self.js_expression(open + 1)?;
                let child = Child {
                    start: open,
                    kind: ChildKind::Expression(expression),
                };
                Ok((child, close + 1))
            }
        }
    }

    fn markup_first(&mut self, open: usize, lt: usize) -> Parse<(Child, usize)> {
        let mut entries: Vec<Entry> = Vec::new();
        let mut token = lexed(Kind::Angle, lt, lt + 1);
        let close = loop {
            let mut next = Next::Child;
            let pos = match token.kind {
                Kind::Eof => return Err(self.eof()),
                Kind::CloseBrace => break token.start,
                Kind::Junk => token.end,
                Kind::Text => {
                    let blank = self.bytes[token.start..token.end]
                        .iter()
                        .all(|byte| matches!(byte, b' ' | b'\t' | b'\n' | b'\r' | b'\x0c'));
                    entries.push(Entry::Text {
                        start: token.start,
                        blank,
                    });
                    token.end
                }
                Kind::Angle => {
                    let after = self.token(token.start + 1);
                    match self.byte(after.start) {
                        Some(b'/') => return Err(self.unexpected(after.start..after.end)),
                        Some(b'!') => {
                            if let Some(end) = self.comment(after.start) {
                                entries.push(Entry::Child(other(token.start)));
                                end
                            } else {
                                token.end
                            }
                        }
                        _ => match self.tag_at(token.start, after)? {
                            Some(parsed) => {
                                next = parsed.next;
                                entries.push(Entry::Markup(parsed.markup));
                                parsed.end
                            }
                            None => return Err(self.unexpected(after.start..after.end)),
                        },
                    }
                }
                Kind::OpenBrace => {
                    let (child, close) = self.nested_container(token.start)?;
                    entries.push(Entry::Child(child));
                    self.child_token(close + 1, self.foreign).end
                }
            };
            token = self.read(pos, next);
        };
        if matches!(entries.last(), Some(Entry::Text { blank: true, .. })) {
            entries.pop();
        }
        let end = close + 1;
        let single = entries.len() == 1;
        let node = match entries.pop() {
            Some(Entry::Markup(markup)) if single => markup,
            last => {
                entries.extend(last);
                let children = entries
                    .into_iter()
                    .map(|entry| match entry {
                        Entry::Markup(markup) => into_child(markup),
                        Entry::Child(child) => child,
                        Entry::Text { start, .. } => other(start),
                    })
                    .collect();
                Markup::Fragment(Fragment {
                    span: open + 1..end,
                    children,
                })
            }
        };
        let span = node.span();
        let child = Child {
            start: open,
            kind: ChildKind::Expression(Expression {
                span,
                markup: vec![node],
            }),
        };
        Ok((child, end))
    }

    fn nested_container(&mut self, open: usize) -> Parse<(Child, usize)> {
        let first = self.token(open + 1);
        let spread = &self.source[first.start..first.end] == "...";
        let start = if spread { first.end } else { open + 1 };
        let (expression, close) = self.js_expression(start)?;
        if expression.span.is_empty() {
            return Err(self.unexpected(close..close + 1));
        }
        let kind = if spread {
            ChildKind::Spread(expression)
        } else {
            ChildKind::Expression(expression)
        };
        Ok((Child { start: open, kind }, close))
    }

    pub(super) fn js_expression(&mut self, start: usize) -> Parse<(Expression, usize)> {
        self.js_scan(start, Until::Brace)
    }

    pub(super) fn js_template(&mut self, start: usize) -> Parse<(Expression, usize)> {
        self.js_scan(start, Until::Template)
    }

    fn js_scan(&mut self, start: usize, until: Until) -> Parse<(Expression, usize)> {
        self.nested(start, |this| this.js_scan_at(start, until))
    }

    #[allow(
        clippy::too_many_lines,
        reason = "one token loop keeps the operand and bracket state in one place"
    )]
    fn js_scan_at(&mut self, start: usize, until: Until) -> Parse<(Expression, usize)> {
        let source: &'s str = self.source;
        let mut lexer = Lexer::new(source, start);
        let mut scan = Scan {
            stack: Vec::new(),
            operand: true,
            prev: Prev::Start,
            pending: Pending::Nothing,
            first: None,
            last: start,
            markup: Vec::new(),
        };
        loop {
            let token = lexer.next_token(scan.operand);
            let text = &source[token.start..token.end];
            if token.kind == TokenKind::Eof {
                return Err(self.eof());
            }
            let unterminated = match token.kind {
                TokenKind::Regex if !regex_terminated(source, token) => {
                    Some("Unterminated regular expression")
                }
                TokenKind::String if !string_terminated(source, token) => {
                    Some("Unterminated string")
                }
                _ => None,
            };
            if let Some(message) = unterminated {
                self.diagnostics
                    .push(diagnostic(message, token.start..token.end));
                return Err(Fatal);
            }
            let top = match until {
                Until::Brace => scan.stack.is_empty(),
                Until::Template => scan.stack == [Frame::Interpolation],
            };
            if top
                && token.kind == TokenKind::Punctuator
                && (text == ";" || (text == "}" && scan.prev == Prev::Comma))
            {
                return Err(self.unexpected(token.start..token.end));
            }
            if until == Until::Brace && top && text == "}" {
                return Ok((scan.expression(token.start), token.start));
            }
            let pending = std::mem::replace(&mut scan.pending, Pending::Nothing);
            let prev = std::mem::replace(&mut scan.prev, Prev::Other);
            scan.first.get_or_insert(token.start);
            scan.last = token.end;
            match token.kind {
                TokenKind::Identifier if pending == Pending::Member => scan.operand = false,
                TokenKind::Identifier => match text {
                    "if" | "while" | "for" | "with" | "switch" | "catch" => {
                        scan.pending = Pending::Control;
                        scan.operand = true;
                    }
                    "else" | "do" | "try" | "finally" => {
                        scan.operand = true;
                        scan.prev = Prev::Keyword;
                    }
                    "typeof" | "void" | "delete" | "await" | "yield" | "new" => {
                        scan.operand = true;
                        scan.pending = Pending::Unary;
                    }
                    "return" | "in" | "of" | "instanceof" | "case" | "throw" | "extends" => {
                        scan.operand = true;
                    }
                    _ => scan.operand = false,
                },
                TokenKind::TemplateHead => {
                    scan.stack.push(Frame::Interpolation);
                    scan.operand = true;
                }
                TokenKind::Punctuator => match text {
                    "<" if scan.operand && !self.generic_arrow(token.end) => {
                        let Some(parsed) = self.tag(token.start)? else {
                            return Err(self.unexpected(token.start..token.end));
                        };
                        if parsed.next == Next::Stuck {
                            return Err(self.unexpected(parsed.end - 1..parsed.end));
                        }
                        scan.last = parsed.end;
                        scan.markup.push(parsed.markup);
                        scan.operand = false;
                        if pending != Pending::Unary {
                            scan.pending = Pending::Markup;
                        }
                        lexer.set_position(parsed.end);
                    }
                    "<" if pending == Pending::Markup && self.sibling_ahead(token.start) => {
                        let end = self.group(&mut scan.markup, token.start)?;
                        scan.last = end;
                        scan.operand = false;
                        lexer.set_position(end);
                    }
                    "(" => {
                        scan.stack.push(Frame::Paren {
                            control: pending == Pending::Control,
                        });
                        scan.operand = true;
                    }
                    ")" => {
                        let Some(Frame::Paren { control }) = scan.stack.pop() else {
                            return Err(self.unexpected(token.start..token.end));
                        };
                        scan.operand = control;
                        scan.prev = Prev::CloseParen;
                    }
                    "[" => {
                        scan.stack.push(Frame::Bracket);
                        scan.operand = true;
                    }
                    "]" => {
                        if scan.stack.pop() != Some(Frame::Bracket) {
                            return Err(self.unexpected(token.start..token.end));
                        }
                        scan.operand = false;
                    }
                    "{" => {
                        let block = matches!(
                            prev,
                            Prev::CloseParen
                                | Prev::Arrow
                                | Prev::Semicolon
                                | Prev::BlockOpen
                                | Prev::BlockClose
                                | Prev::Keyword
                        );
                        scan.stack.push(Frame::Brace { block });
                        scan.operand = true;
                        if block {
                            scan.prev = Prev::BlockOpen;
                        }
                    }
                    "}" => match scan.stack.pop() {
                        Some(Frame::Interpolation) => {
                            lexer.set_position(token.start);
                            let piece = lexer.continue_template();
                            scan.last = piece.end;
                            if piece.kind == TokenKind::TemplateTail {
                                scan.operand = false;
                            } else {
                                scan.stack.push(Frame::Interpolation);
                                scan.operand = true;
                            }
                        }
                        Some(Frame::Brace { block }) => {
                            scan.operand = block;
                            if block {
                                scan.prev = Prev::BlockClose;
                            }
                        }
                        _ => return Err(self.unexpected(token.start..token.end)),
                    },
                    "." | "?." => {
                        scan.pending = Pending::Member;
                        scan.operand = true;
                    }
                    "=>" => {
                        scan.operand = true;
                        scan.prev = Prev::Arrow;
                    }
                    ";" => {
                        scan.operand = true;
                        scan.prev = Prev::Semicolon;
                    }
                    "++" | "--" | "!" | "+" | "-" | "~" if scan.operand => {
                        scan.pending = Pending::Unary;
                    }
                    "++" | "--" | "!" => {}
                    "," => {
                        scan.operand = true;
                        scan.prev = Prev::Comma;
                    }
                    _ => scan.operand = true,
                },
                _ => scan.operand = false,
            }
            if until == Until::Template && scan.stack.is_empty() {
                let end = scan.last;
                return Ok((scan.expression(end), end));
            }
        }
    }

    fn generic_arrow(&self, after_lt: usize) -> bool {
        let mut token = self.token(after_lt);
        if &self.source[token.start..token.end] == "const" {
            token = self.token(token.end);
        }
        if token.kind != TokenKind::Identifier {
            return false;
        }
        let next = self.token(token.end);
        match &self.source[next.start..next.end] {
            "," | "=" => true,
            "extends" => {
                let after = self.token(next.end);
                !matches!(self.byte(after.start), Some(b'=' | b'>' | b'/'))
            }
            _ => false,
        }
    }

    fn sibling_ahead(&mut self, lt: usize) -> bool {
        let after = self.token(lt + 1);
        if self.byte(after.start) == Some(b'>') || after.kind == TokenKind::Identifier {
            return true;
        }
        self.bytes
            .get(lt + 1..)
            .is_some_and(|rest| rest.starts_with(b"!--"))
            && self.comment_close_from(lt + 4).is_some()
    }

    fn comment_close_from(&mut self, from: usize) -> Option<usize> {
        if let Some((searched, close)) = self.comment_close
            && searched <= from
            && close.is_none_or(|close| close >= from)
        {
            return close;
        }
        #[cfg(test)]
        {
            self.comment_scans += 1;
        }
        let close = self
            .bytes
            .get(from..)
            .and_then(|rest| find(rest, b"-->"))
            .map(|index| from + index);
        self.comment_close = Some((from, close));
        close
    }

    fn group(&mut self, markup: &mut Vec<Markup>, first_lt: usize) -> Parse<usize> {
        let Some(lhs) = markup.pop() else {
            return Ok(first_lt);
        };
        let span = lhs.span();
        let (start, mut end) = (span.start, span.end);
        let mut siblings = Vec::new();
        let mut lt = first_lt;
        loop {
            if self
                .bytes
                .get(lt + 1..)
                .is_some_and(|rest| rest.starts_with(b"!--"))
            {
                let Some(comment_end) = self.comment(lt + 1) else {
                    break;
                };
                siblings.push(other(lt));
                end = comment_end;
            } else {
                let after = self.token(lt + 1);
                let Some(parsed) = self.tag_at(lt, after)? else {
                    break;
                };
                if parsed.next == Next::Stuck {
                    return Err(self.unexpected(parsed.end - 1..parsed.end));
                }
                end = parsed.end;
                siblings.push(into_child(parsed.markup));
            }
            let next = self.token(end);
            if &self.source[next.start..next.end] != "<" {
                break;
            }
            lt = next.start;
        }
        if siblings.is_empty() {
            markup.push(lhs);
            return Ok(end);
        }
        let mut children = vec![into_child(lhs)];
        children.extend(siblings);
        markup.push(Markup::Fragment(Fragment {
            span: start..end,
            children,
        }));
        Ok(end)
    }
}

#[cfg(test)]
mod tests {
    use super::Parser;

    #[test]
    fn unclosed_comments_after_markup_search_for_the_close_once() {
        let source = format!("{{c && {}1}}", "<a/> <!-- 1, ".repeat(1_000));
        let mut parser = Parser::new(&source);
        let _ = parser.body(0);
        assert!(parser.diagnostics.is_empty());
        assert_eq!(parser.comment_scans, 1);
    }

    #[test]
    fn cached_comment_close_is_reused_until_it_falls_behind() {
        let source = "a --> b --> c";
        let mut parser = Parser::new(source);
        assert_eq!(parser.comment_close_from(0), Some(2));
        assert_eq!(parser.comment_close_from(1), Some(2));
        assert_eq!(parser.comment_scans, 1);
        assert_eq!(parser.comment_close_from(3), Some(8));
        assert_eq!(parser.comment_close_from(9), None);
        assert_eq!(parser.comment_close_from(10), None);
        assert_eq!(parser.comment_scans, 3);
    }
}
