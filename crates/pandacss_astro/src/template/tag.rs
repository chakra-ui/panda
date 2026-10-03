use std::ops::Range;

use super::{
    Kind, Next, Parse, Parsed, Parser, diagnostic, element_markup, find, fragment_markup, other,
};
use crate::js::{Token, TokenKind};
use crate::tree::{Attribute, Child, Element, Expression, Value};

const VOID: [&str; 14] = [
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source",
    "track", "wbr",
];

enum OpenEnd {
    SelfClose(usize),
    Open(usize),
}

enum Closing {
    Fragment(Range<usize>),
    Element { name: Range<usize>, end: usize },
}

impl<'s> Parser<'s> {
    pub(super) fn tag(&mut self, lt: usize) -> Parse<Option<Parsed>> {
        let after = self.token(lt + 1);
        self.tag_at(lt, after)
    }

    pub(super) fn tag_at(&mut self, lt: usize, after: Token) -> Parse<Option<Parsed>> {
        if self.byte(after.start) == Some(b'>') {
            return self.fragment(lt, after.start + 1).map(Some);
        }
        if after.kind != TokenKind::Identifier {
            return Ok(None);
        }
        if &self.source[after.start..after.end] == "script" {
            return self.script(lt, after.start, false).map(Some);
        }
        self.element(lt, after).map(Some)
    }

    pub(super) fn fragment(&mut self, lt: usize, content: usize) -> Parse<Parsed> {
        self.nested(lt, |this| this.fragment_at(lt, content))
    }

    fn fragment_at(&mut self, lt: usize, content: usize) -> Parse<Parsed> {
        let (children, closing) = self.children(content)?;
        let end = match closing {
            Closing::Fragment(span) => span.end,
            Closing::Element { name, end } => {
                self.diagnostics.push(diagnostic(
                    &format!(
                        "Expected corresponding closing tag for JSX fragment, found '</{}>'",
                        &self.source[name.clone()]
                    ),
                    name,
                ));
                end
            }
        };
        Ok(Parsed {
            markup: fragment_markup(lt..end, children),
            end,
            next: Next::Child,
        })
    }

    pub(super) fn element(&mut self, lt: usize, first: Token) -> Parse<Parsed> {
        self.nested(lt, |this| this.element_at(lt, first))
    }

    fn element_at(&mut self, lt: usize, first: Token) -> Parse<Parsed> {
        let source: &'s str = self.source;
        let name = self.element_name(first)?;
        let name_text = &source[name.clone()];
        let after_name = self.type_arguments(name.end)?;
        let (attributes, open_end) = self.attributes(after_name)?;
        let raw = name_text == "style"
            || attributes.iter().any(|attribute| {
                attribute
                    .name
                    .as_ref()
                    .is_some_and(|span| &source[span.clone()] == "is:raw")
            });
        let (gt_end, next) = match open_end {
            OpenEnd::SelfClose(end) => (end, Next::Child),
            OpenEnd::Open(end) if VOID.contains(&name_text) => {
                (end, if raw { Next::Stuck } else { Next::Child })
            }
            OpenEnd::Open(end) => {
                self.open.push(name.clone());
                let result = if raw {
                    self.raw_children(&name, end)
                } else {
                    self.element_children(&name, end)
                };
                self.open.pop();
                let (children, close_end, next) = result?;
                let element = Element {
                    name,
                    opening: lt..end,
                    attributes,
                    children,
                    script: None,
                };
                return Ok(Parsed {
                    markup: element_markup(lt..close_end, element),
                    end: close_end,
                    next,
                });
            }
        };
        let element = Element {
            name,
            opening: lt..gt_end,
            attributes,
            children: Vec::new(),
            script: None,
        };
        Ok(Parsed {
            markup: element_markup(lt..gt_end, element),
            end: gt_end,
            next,
        })
    }

    fn element_children(
        &mut self,
        name: &Range<usize>,
        start: usize,
    ) -> Parse<(Vec<Child>, usize, Next)> {
        let source: &'s str = self.source;
        let math = &source[name.clone()] == "math";
        let saved = self.foreign;
        if math {
            self.foreign = true;
        }
        let result = self.children(start);
        self.foreign = saved;
        let (children, closing) = result?;
        let end = match closing {
            Closing::Fragment(span) => return Err(self.unexpected(span)),
            Closing::Element {
                name: closing_name,
                end,
            } => {
                if source[closing_name.clone()] != source[name.clone()] {
                    self.mismatch(closing_name, name);
                }
                end
            }
        };
        let next = if math { Next::Foreign } else { Next::Child };
        Ok((children, end, next))
    }

    fn raw_children(
        &mut self,
        name: &Range<usize>,
        start: usize,
    ) -> Parse<(Vec<Child>, usize, Next)> {
        let source: &'s str = self.source;
        let mut needle = b"</".to_vec();
        needle.extend_from_slice(source[name.clone()].as_bytes());
        let Some(index) = self.bytes.get(start..).and_then(|rest| find(rest, &needle)) else {
            return Err(self.eof());
        };
        let content_end = start + index;
        let children = if index > 0 {
            vec![other(start)]
        } else {
            Vec::new()
        };
        let name_token = self.token(content_end + 2);
        if name_token.kind != TokenKind::Identifier {
            return Err(self.unexpected(name_token.start..name_token.end));
        }
        let closing_name = self.element_name(name_token)?;
        let gt = self.token(closing_name.end);
        if self.byte(gt.start) != Some(b'>') {
            return Err(self.unexpected(gt.start..gt.end));
        }
        if source[closing_name.clone()] != source[name.clone()] {
            self.mismatch(closing_name, name);
        }
        Ok((children, gt.start + 1, Next::Child))
    }

    fn mismatch(&mut self, closing: Range<usize>, opening: &Range<usize>) {
        let message = format!(
            "Expected corresponding closing tag for '<{}>'",
            &self.source[opening.clone()]
        );
        self.diagnostics.push(diagnostic(&message, closing));
    }

    fn children(&mut self, start: usize) -> Parse<(Vec<Child>, Closing)> {
        let mut children = Vec::new();
        let mut pos = start;
        let mut next = Next::Child;
        loop {
            if next == Next::Stuck {
                return Err(self.unexpected(pos - 1..pos));
            }
            let token = self.read(pos, next);
            next = Next::Child;
            match token.kind {
                Kind::Eof => return Err(self.eof()),
                Kind::Junk => {
                    let junk = self.token(token.start);
                    self.check_terminated(junk)?;
                    return Err(self.unexpected(token.start..token.end));
                }
                Kind::CloseBrace => {
                    return Err(self.unexpected(token.start..token.end));
                }
                Kind::Text => {
                    children.push(other(token.start));
                    pos = token.end;
                }
                Kind::OpenBrace => {
                    let (child, end) = self.container(token.start)?;
                    children.push(child);
                    pos = end;
                }
                Kind::Angle => {
                    let after = self.token(token.start + 1);
                    match self.byte(after.start) {
                        Some(b'/' | b'!') if after.end != after.start + 1 => {
                            return Err(self.unexpected(after.start..after.end));
                        }
                        Some(b'/') => match self.closing(after.start + 1)? {
                            Ok(closing) => return Ok((children, closing)),
                            Err(end) => pos = end,
                        },
                        Some(b'!') => {
                            let Some(end) = self.comment(after.start) else {
                                return Err(self.unexpected(after.start..after.end));
                            };
                            children.push(other(token.start));
                            pos = end;
                        }
                        _ => match self.tag_at(token.start, after)? {
                            Some(parsed) => {
                                pos = parsed.end;
                                next = parsed.next;
                                children.push(parsed.into_child());
                            }
                            None => return Err(self.unexpected(after.start..after.end)),
                        },
                    }
                }
            }
        }
    }

    pub(super) fn comment(&self, bang: usize) -> Option<usize> {
        let rest = self.bytes.get(bang..)?;
        if !rest.starts_with(b"!--") {
            return None;
        }
        find(&rest[3..], b"-->").map(|index| bang + 3 + index + 3)
    }

    fn closing(&mut self, start: usize) -> Parse<Result<Closing, usize>> {
        let source: &'s str = self.source;
        let token = self.token(start);
        if self.byte(token.start) == Some(b'>') {
            return Ok(Ok(Closing::Fragment(token.start..token.start + 1)));
        }
        if token.kind != TokenKind::Identifier {
            return Err(self.unexpected(token.start..token.end));
        }
        let name = self.element_name(token)?;
        let gt = self.token(name.end);
        if self.byte(gt.start) != Some(b'>') {
            return Err(self.unexpected(gt.start..gt.end));
        }
        let end = gt.start + 1;
        let text = &source[name.clone()];
        if !self.open.iter().any(|open| &source[open.clone()] == text) {
            let message = format!("Closing tag '</{text}>' has no matching opening tag.");
            self.diagnostics.push(diagnostic(&message, name));
            return Ok(Err(end));
        }
        Ok(Ok(Closing::Element { name, end }))
    }

    fn element_name(&mut self, first: Token) -> Parse<Range<usize>> {
        let start = first.start;
        let mut end = self.name_segment_end(first.end);
        loop {
            let dot = self.token(end);
            if &self.source[dot.start..dot.end] != "." {
                break;
            }
            let member = self.token(dot.end);
            if member.kind != TokenKind::Identifier {
                return Err(self.unexpected(member.start..member.end));
            }
            end = self.name_segment_end(member.end);
        }
        Ok(start..end)
    }

    fn name_segment_end(&self, start: usize) -> usize {
        let mut pos = start;
        while let Some(ch) = self.source.get(pos..).and_then(|rest| rest.chars().next()) {
            let name_char = ch == '-'
                || ch == '_'
                || ch == '$'
                || ch.is_ascii_alphanumeric()
                || (!ch.is_ascii() && !ch.is_whitespace() && ch != '\u{feff}');
            if !name_char {
                break;
            }
            pos += ch.len_utf8();
        }
        pos
    }

    fn type_arguments(&mut self, pos: usize) -> Parse<usize> {
        let open = self.token(pos);
        if &self.source[open.start..open.end] != "<" {
            return Ok(pos);
        }
        let first = self.token(open.end);
        if self.byte(first.start) == Some(b'>') {
            self.diagnostics.push(diagnostic(
                "Type argument list cannot be empty.",
                open.start..first.start + 1,
            ));
            return Ok(first.start + 1);
        }
        let mut depth = 1usize;
        let mut cursor = open.end;
        loop {
            let token = self.token(cursor);
            let text = &self.source[token.start..token.end];
            match token.kind {
                TokenKind::Identifier | TokenKind::Number => {}
                TokenKind::String | TokenKind::NoSubstitutionTemplate => {
                    self.check_terminated(token)?;
                }
                TokenKind::Punctuator if text.starts_with('>') => {
                    for (index, byte) in text.bytes().enumerate() {
                        if byte != b'>' {
                            return Ok(pos);
                        }
                        depth -= 1;
                        if depth == 0 {
                            return Ok(token.start + index + 1);
                        }
                    }
                }
                TokenKind::Punctuator if text == "<" => depth += 1,
                TokenKind::Punctuator
                    if matches!(
                        text,
                        "," | "."
                            | "["
                            | "]"
                            | "|"
                            | "&"
                            | "?"
                            | ":"
                            | "{"
                            | "}"
                            | ";"
                            | "("
                            | ")"
                            | "=>"
                            | "="
                            | "..."
                    ) => {}
                _ => return Ok(pos),
            }
            cursor = token.end;
        }
    }

    fn attributes(&mut self, start: usize) -> Parse<(Vec<Attribute>, OpenEnd)> {
        let mut attributes = Vec::new();
        let mut pos = start;
        loop {
            let token = self.token(pos);
            match self.byte(token.start) {
                None => return Err(self.eof()),
                Some(b'<') => return Err(self.unexpected(token.start..token.end)),
                Some(b'>') => return Ok((attributes, OpenEnd::Open(token.start + 1))),
                Some(b'/') => {
                    let gt = self.token(token.start + 1);
                    if self.byte(gt.start) != Some(b'>') {
                        return Err(self.unexpected(gt.start..gt.end));
                    }
                    return Ok((attributes, OpenEnd::SelfClose(gt.start + 1)));
                }
                Some(b'{') => {
                    let (attribute, end) = self.brace_attribute(token.start)?;
                    attributes.extend(attribute);
                    pos = end;
                }
                Some(_) => {
                    if token.kind == TokenKind::Number
                        && !valid_number(&self.source[token.start..token.end])
                    {
                        return Err(self.unexpected(token.start..token.end));
                    }
                    let (attribute, end) = self.named_attribute(token.start)?;
                    attributes.push(attribute);
                    pos = end;
                }
            }
        }
    }

    fn brace_attribute(&mut self, open: usize) -> Parse<(Option<Attribute>, usize)> {
        let first = self.token(open + 1);
        let text = &self.source[first.start..first.end];
        if text == "}" {
            return Ok((None, first.end));
        }
        if text == "..." {
            let (expression, close) = self.js_expression(first.end)?;
            let attribute = Attribute {
                name: None,
                value: Value::Spread(expression),
            };
            return Ok((Some(attribute), close + 1));
        }
        if first.kind == TokenKind::Identifier {
            let close = self.token(first.end);
            if self.byte(close.start) == Some(b'}') {
                let attribute = Attribute {
                    name: Some(first.start..first.end),
                    value: Value::Expression(Expression {
                        span: first.start..first.end,
                        markup: Vec::new(),
                    }),
                };
                return Ok((Some(attribute), close.end));
            }
        }
        let (expression, close) = self.js_expression(open + 1)?;
        if expression.span.is_empty() {
            return Err(self.unexpected(close..close + 1));
        }
        let attribute = Attribute {
            name: Some(expression.span.clone()),
            value: Value::Expression(expression),
        };
        Ok((Some(attribute), close + 1))
    }

    fn named_attribute(&mut self, start: usize) -> Parse<(Attribute, usize)> {
        let end = match self.byte(start) {
            Some(byte) if name_terminator(byte) => start + 1,
            _ => {
                let mut end = start;
                while self.byte(end).is_some_and(|byte| !name_terminator(byte)) {
                    end += 1;
                }
                end
            }
        };
        let name = Some(start..end);
        let equals = self.token(end);
        if &self.source[equals.start..equals.end] != "=" {
            return Ok((
                Attribute {
                    name,
                    value: Value::Boolean,
                },
                end,
            ));
        }
        let (value, end) = self.value(equals.end)?;
        Ok((Attribute { name, value }, end))
    }

    fn value(&mut self, start: usize) -> Parse<(Value, usize)> {
        let mut pos = start;
        while matches!(self.byte(pos), Some(b' ' | b'\t' | b'\r' | b'\n')) {
            pos += 1;
        }
        match self.byte(pos) {
            None => Err(self.eof()),
            Some(b'>' | b'}') => Err(self.unexpected(pos..pos + 1)),
            Some(quote @ (b'"' | b'\'')) => {
                let Some(index) = self.bytes[pos + 1..].iter().position(|&byte| byte == quote)
                else {
                    return Err(self.eof());
                };
                let end = pos + 1 + index + 1;
                Ok((
                    Value::Static {
                        span: pos..end,
                        quoted: true,
                    },
                    end,
                ))
            }
            Some(b'`') => {
                let (expression, end) = self.js_template(pos)?;
                Ok((Value::Expression(expression), end))
            }
            Some(b'{') => {
                let first = self.token(pos + 1);
                if self.byte(first.start) == Some(b'}') {
                    return Ok((Value::Empty, first.end));
                }
                let (expression, close) = self.js_expression(pos + 1)?;
                Ok((Value::Expression(expression), close + 1))
            }
            Some(b'<') => match self.nested(pos, |this| this.tag(pos))? {
                Some(parsed) => {
                    let end = if parsed.next == Next::Stuck {
                        parsed.end - 1
                    } else {
                        parsed.end
                    };
                    Ok((Value::Markup(parsed.markup), end))
                }
                None => Err(self.unexpected(pos..pos + 1)),
            },
            Some(_) => {
                let mut end = pos;
                while self.byte(end).is_some_and(|byte| {
                    !matches!(
                        byte,
                        b'>' | b'{' | b'}' | b'<' | b' ' | b'\t' | b'\n' | b'\r'
                    )
                }) {
                    end += 1;
                }
                Ok((
                    Value::Static {
                        span: pos..end,
                        quoted: false,
                    },
                    end,
                ))
            }
        }
    }

    pub(super) fn script(&mut self, lt: usize, name_start: usize, top: bool) -> Parse<Parsed> {
        self.nested(lt, |this| this.script_at(lt, name_start, top))
    }

    fn script_at(&mut self, lt: usize, name_start: usize, top: bool) -> Parse<Parsed> {
        let name = name_start..name_start + 6;
        let (attributes, open_end) = self.attributes(name.end)?;
        let (opening, end, children, next, content) = match open_end {
            OpenEnd::SelfClose(end) => (lt..end, end, Vec::new(), Next::Child, None),
            OpenEnd::Open(content) => {
                let Some(index) = self
                    .bytes
                    .get(content..)
                    .and_then(|rest| find(rest, b"</script"))
                else {
                    return Err(self.eof());
                };
                let content_end = content + index;
                let after = content_end + 8;
                let (end, next) = if top {
                    let Some(gt) = self.bytes[after..].iter().position(|&byte| byte == b'>') else {
                        return Err(self.eof());
                    };
                    (after + gt + 1, Next::Child)
                } else {
                    let name = self.token(content_end + 2);
                    let gt = self.token(name.end);
                    if self.byte(gt.start) == Some(b'>') {
                        (gt.start + 1, Next::Js)
                    } else {
                        (name.end, Next::Js)
                    }
                };
                (
                    lt..content,
                    end,
                    vec![other(lt)],
                    next,
                    Some(content..content_end),
                )
            }
        };
        let script = content.filter(|_| self.bundled(&attributes));
        let element = Element {
            name,
            opening,
            attributes,
            children,
            script,
        };
        Ok(Parsed {
            markup: element_markup(lt..end, element),
            end,
            next,
        })
    }
}

const SCRIPT_TYPES: [&str; 6] = [
    "text/javascript",
    "text/ecmascript",
    "application/javascript",
    "application/ecmascript",
    "application/x-javascript",
    "module",
];

impl Parser<'_> {
    fn bundled(&self, attributes: &[Attribute]) -> bool {
        let named = |attribute: &Attribute, expected: &str| {
            attribute
                .name
                .as_ref()
                .is_some_and(|name| &self.source[name.clone()] == expected)
        };
        if attributes
            .iter()
            .any(|attribute| named(attribute, "is:inline") || named(attribute, "define:vars"))
        {
            return false;
        }
        match attributes.iter().find(|attribute| named(attribute, "type")) {
            None => true,
            Some(Attribute {
                value: Value::Static { span, quoted },
                ..
            }) => {
                let value = if *quoted {
                    &self.source[span.start + 1..span.end.saturating_sub(1)]
                } else {
                    &self.source[span.clone()]
                };
                SCRIPT_TYPES.contains(&value)
            }
            Some(_) => false,
        }
    }
}

fn name_terminator(byte: u8) -> bool {
    matches!(
        byte,
        b'=' | b'>' | b'/' | b'{' | b'}' | b'<' | b' ' | b'\t' | b'\n' | b'\r'
    )
}

pub(super) fn valid_number(text: &str) -> bool {
    let text = text.strip_suffix('n').unwrap_or(text);
    let bytes = text.as_bytes();
    let radix_digit: Option<fn(&u8) -> bool> = match (bytes.first(), bytes.get(1)) {
        (Some(b'0'), Some(b'x' | b'X')) => Some(u8::is_ascii_hexdigit),
        (Some(b'0'), Some(b'b' | b'B')) => Some(|byte| matches!(byte, b'0' | b'1')),
        (Some(b'0'), Some(b'o' | b'O')) => Some(|byte| matches!(byte, b'0'..=b'7')),
        _ => None,
    };
    if let Some(radix_digit) = radix_digit {
        let digits = &text[2..];
        return !digits.is_empty()
            && digits
                .bytes()
                .all(|byte| radix_digit(&byte) || byte == b'_')
            && !digits.starts_with('_')
            && !digits.ends_with('_');
    }
    let (mantissa, exponent) = match text.find(['e', 'E']) {
        Some(index) => (&text[..index], Some(&text[index + 1..])),
        None => (text, None),
    };
    let mantissa_ok = mantissa.bytes().any(|byte| byte.is_ascii_digit())
        && mantissa
            .bytes()
            .all(|byte| byte.is_ascii_digit() || byte == b'.' || byte == b'_')
        && !mantissa.ends_with('_');
    let exponent_ok = exponent.is_none_or(|exponent| {
        let digits = exponent.strip_prefix(['+', '-']).unwrap_or(exponent);
        !digits.is_empty() && digits.bytes().all(|byte| byte.is_ascii_digit())
    });
    mantissa_ok && exponent_ok
}
