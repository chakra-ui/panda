//! Parse a `css` tagged-template *string* into a nested style object, so
//! `` css`color: red; &:hover { color: blue }` `` extracts like the object form
//! `{ color: 'red', '&:hover': { color: 'blue' } }`. The `astish` parser is a
//! Rust port of the small JS library Panda uses for the same job: a flat scan
//! that builds a tree of selector/declaration nodes via a parent stack.

use crate::{Literal, Resolver, literal::template_literal_to_literal};
use oxc_ast::ast::TemplateLiteral;
use rustc_hash::FxHashMap;
use std::borrow::Cow;

/// Fold a template literal to a string (interpolations resolved), then parse
/// that CSS text into a style object. `None` if the template isn't static.
pub(crate) fn css_template_to_object(
    t: &TemplateLiteral<'_>,
    resolver: Option<&Resolver<'_>>,
) -> Option<Literal> {
    let Literal::String(text) = template_literal_to_literal(t, resolver)? else {
        return None;
    };
    Some(astish(&text))
}

/// Scan cleaned CSS token-by-token, maintaining a stack of open selector
/// nodes: a selector opens a child node (auto-prefixed `& ` when bare), `}`
/// pops, and each `prop: value` declaration writes into the current node.
fn astish(val: &str) -> Literal {
    let cleaned = clean_css(val);
    let css = cleaned.as_ref();
    let mut builder = AstishBuilder::default();
    let mut stack = vec![0];
    let mut pos = 0;

    while let Some(token) = next_css_token(css, pos) {
        match token.kind {
            CssTokenKind::Close => {
                if stack.len() > 1 {
                    stack.pop();
                }
            }
            CssTokenKind::Selector(selector) => {
                let mut selector = normalize_newlines(selector).trim().to_owned();
                if !selector.is_empty() {
                    if !selector.contains('&') && !selector.starts_with('@') {
                        selector.insert_str(0, "& ");
                    }
                    let parent = *stack.last().expect("root node");
                    let child = builder.ensure_child(parent, selector);
                    stack.push(child);
                }
            }
            CssTokenKind::Declaration(declaration) => {
                if let Some((prop, value)) = parse_declaration(declaration) {
                    let node = *stack.last().expect("root node");
                    builder.upsert_string(node, prop, value);
                }
            }
        }
        pos = token.end;
    }

    builder.into_literal()
}

/// Arena of style nodes (index-linked rather than `Box`ed) built during the
/// scan, flattened to a [`Literal::Object`] tree at the end. Each node keeps a
/// key→entry index so repeated selectors/props merge instead of duplicating.
#[derive(Default)]
struct AstishBuilder {
    nodes: Vec<AstishNode>,
}

impl AstishBuilder {
    fn ensure_root(&mut self) {
        if self.nodes.is_empty() {
            self.nodes.push(AstishNode::default());
        }
    }

    fn ensure_child(&mut self, parent: usize, key: String) -> usize {
        self.ensure_root();

        if let Some(entry_index) = self.nodes[parent].index.get(&key).copied() {
            if let AstishValue::Object(child) = self.nodes[parent].entries[entry_index].1 {
                return child;
            }

            let child = self.push_node();
            self.nodes[parent].entries[entry_index].1 = AstishValue::Object(child);
            return child;
        }

        let child = self.push_node();
        let entry_index = self.nodes[parent].entries.len();
        self.nodes[parent]
            .entries
            .push((key.clone(), AstishValue::Object(child)));
        self.nodes[parent].index.insert(key, entry_index);
        child
    }

    fn upsert_string(&mut self, node: usize, key: String, value: String) {
        self.ensure_root();

        if let Some(entry_index) = self.nodes[node].index.get(&key).copied() {
            self.nodes[node].entries[entry_index].1 = AstishValue::String(value);
            return;
        }

        let entry_index = self.nodes[node].entries.len();
        self.nodes[node]
            .entries
            .push((key.clone(), AstishValue::String(value)));
        self.nodes[node].index.insert(key, entry_index);
    }

    fn push_node(&mut self) -> usize {
        let index = self.nodes.len();
        self.nodes.push(AstishNode::default());
        index
    }

    fn into_literal(mut self) -> Literal {
        self.ensure_root();
        Literal::Object(self.take_node_entries(0))
    }

    fn take_node_entries(&mut self, node: usize) -> Vec<(String, Literal)> {
        std::mem::take(&mut self.nodes[node].entries)
            .into_iter()
            .map(|(key, value)| {
                let value = match value {
                    AstishValue::String(value) => Literal::String(value),
                    AstishValue::Object(child) => Literal::Object(self.take_node_entries(child)),
                };
                (key, value)
            })
            .collect()
    }
}

#[derive(Default)]
struct AstishNode {
    entries: Vec<(String, AstishValue)>,
    index: FxHashMap<String, usize>,
}

enum AstishValue {
    String(String),
    Object(usize),
}

enum CssTokenKind<'a> {
    Declaration(&'a str),
    Selector(&'a str),
    Close,
}

struct CssToken<'a> {
    kind: CssTokenKind<'a>,
    end: usize,
}

fn next_css_token(css: &str, start: usize) -> Option<CssToken<'_>> {
    let bytes = css.as_bytes();
    let mut pos = start;

    while pos < bytes.len() {
        match bytes[pos] {
            b'}' => {
                pos += 1;
                while pos < bytes.len() && bytes[pos].is_ascii_whitespace() {
                    pos += 1;
                }
                return Some(CssToken {
                    kind: CssTokenKind::Close,
                    end: pos,
                });
            }
            b';' => {
                return Some(CssToken {
                    kind: CssTokenKind::Declaration(&css[start..pos]),
                    end: pos + 1,
                });
            }
            b'{' => {
                return Some(CssToken {
                    kind: CssTokenKind::Selector(&css[start..pos]),
                    end: pos + 1,
                });
            }
            _ => pos += 1,
        }
    }

    None
}

fn parse_declaration(declaration: &str) -> Option<(String, String)> {
    let mut chars = declaration.char_indices();
    let (prop_start, first) = chars.find(|(_, ch)| is_css_prop_char(*ch))?;
    let mut prop_end = prop_start + first.len_utf8();

    for (index, ch) in chars {
        if !is_css_prop_char(ch) {
            break;
        }
        prop_end = index + ch.len_utf8();
    }

    let mut value_start = prop_end;
    let rest = &declaration[value_start..];
    value_start += rest.len() - rest.trim_start_matches(' ').len();
    if declaration[value_start..].starts_with(':') {
        value_start += 1;
    }
    let rest = &declaration[value_start..];
    value_start += rest.len() - rest.trim_start_matches(' ').len();

    let value = normalize_newlines(&declaration[value_start..])
        .trim()
        .to_owned();
    (!value.is_empty()).then(|| (declaration[prop_start..prop_end].to_owned(), value))
}

fn is_css_prop_char(ch: char) -> bool {
    ch == '-' || ch == '%' || ch == '@' || ch == '_' || ch.is_ascii_alphanumeric() || ch >= '\u{80}'
}

fn clean_css(val: &str) -> Cow<'_, str> {
    let bytes = val.as_bytes();
    let Some(mut index) = bytes
        .windows(2)
        .position(|pair| pair == b"/*" || pair == b"  ")
    else {
        return Cow::Borrowed(val);
    };

    let mut out = String::with_capacity(val.len());
    out.push_str(&val[..index]);

    while index < bytes.len() {
        if bytes[index..].starts_with(b"/*")
            && let Some(end) = val[index + 2..].find("*/")
        {
            index += end + 4;
            continue;
        }

        if bytes[index] == b' ' && bytes.get(index + 1) == Some(&b' ') {
            index += 2;
            while bytes.get(index) == Some(&b' ') {
                index += 1;
            }
            continue;
        }

        let ch = val[index..].chars().next().expect("valid char boundary");
        out.push(ch);
        index += ch.len_utf8();
    }

    Cow::Owned(out)
}

fn normalize_newlines(value: &str) -> Cow<'_, str> {
    let Some(first) = value.find('\n') else {
        return Cow::Borrowed(value);
    };

    let mut out = String::with_capacity(value.len());
    out.push_str(&value[..first]);
    let mut prev_newline = false;

    for ch in value[first..].chars() {
        if ch == '\n' {
            if !prev_newline {
                out.push(' ');
                prev_newline = true;
            }
        } else {
            out.push(ch);
            prev_newline = false;
        }
    }

    Cow::Owned(out)
}
