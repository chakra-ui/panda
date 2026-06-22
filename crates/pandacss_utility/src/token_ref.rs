//! Token-reference expansion: `{token.path}` and `token(path, fallback?)`
//! resolution into CSS vars or raw token values.

use std::borrow::Cow;

use pandacss_shared::css_escape;
use pandacss_tokens::TokenDictionary;

use crate::split_top_level_slash;

#[must_use]
pub fn expand_token_references_to_vars(value: &str, tokens: &TokenDictionary) -> String {
    expand_token_references(value, tokens, TokenReferenceResolution::CssVar)
}

#[must_use]
pub fn expand_token_references_to_values(value: &str, tokens: &TokenDictionary) -> String {
    expand_token_references(value, tokens, TokenReferenceResolution::Value)
}

#[derive(Clone, Copy)]
enum TokenReferenceResolution {
    CssVar,
    Value,
}

fn expand_token_references(
    value: &str,
    tokens: &TokenDictionary,
    resolution: TokenReferenceResolution,
) -> String {
    let with_braces = replace_wrapped_references(value, '{', '}', tokens, resolution);
    replace_token_functions(&with_braces, tokens, resolution)
}

/// Replace each `{token.path}` occurrence with its CSS-var form, leaving an
/// unterminated `{` (no closing brace) and the rest of the string verbatim.
fn replace_wrapped_references(
    value: &str,
    open: char,
    close: char,
    tokens: &TokenDictionary,
    resolution: TokenReferenceResolution,
) -> String {
    let mut out = String::with_capacity(value.len());
    let mut rest = value;

    while let Some(start) = rest.find(open) {
        out.push_str(&rest[..start]);

        let after_open = &rest[start + open.len_utf8()..];

        let Some(end) = after_open.find(close) else {
            out.push_str(&rest[start..]);
            return out;
        };

        let path = after_open[..end].trim();

        if let Some(value) = resolved_token_reference(path, tokens, resolution) {
            out.push_str(value.as_ref());
        } else {
            out.push_str(&unresolved_wrapped_reference(path));
        }

        rest = &after_open[end + close.len_utf8()..];
    }

    out.push_str(rest);
    out
}

/// Replace each `token(path, fallback?)` call with the resolved var, using the
/// fallback (or the raw path) when the token is unknown. Paren-matched so
/// nested `token(...)` args don't truncate early.
fn replace_token_functions(
    value: &str,
    tokens: &TokenDictionary,
    resolution: TokenReferenceResolution,
) -> String {
    let mut out = String::with_capacity(value.len());
    let mut rest = value;

    while let Some(start) = rest.find("token(") {
        out.push_str(&rest[..start]);

        let after_open = &rest[start + "token(".len()..];

        let Some(end) = find_matching_paren(after_open) else {
            out.push_str(&rest[start..]);
            return out;
        };

        let args = &after_open[..end];
        let (path, fallback) = split_token_args(args);
        let path = path.trim();

        let fallback =
            fallback.map(|value| expand_token_fallback(value.trim(), tokens, resolution));

        if let Some(value) = resolved_token_reference(path, tokens, resolution) {
            let value = match (resolution, fallback) {
                (TokenReferenceResolution::CssVar, Some(fallback)) => {
                    css_var_with_fallback(value.as_ref(), &fallback)
                        .map(Cow::Owned)
                        .unwrap_or(value)
                }
                _ => value,
            };
            out.push_str(value.as_ref());
        } else {
            let value = fallback.unwrap_or_else(|| css_escape(path));
            out.push_str(value.as_str());
        }

        rest = &after_open[end + 1..];
    }

    out.push_str(rest);
    out
}

fn unresolved_wrapped_reference(path: &str) -> String {
    if is_token_path_like(path) {
        css_escape(path)
    } else {
        path.to_owned()
    }
}

fn is_token_path_like(path: &str) -> bool {
    path.as_bytes()
        .windows(3)
        .any(|window| is_word_byte(window[0]) && window[1] == b'.' && is_word_byte(window[2]))
}

pub(crate) fn is_plain_token_path_like(value: &str) -> bool {
    let value = value.trim();
    let value = split_top_level_slash(value).map_or(value, |(path, _)| path.trim());
    let Some(first) = value.bytes().next() else {
        return false;
    };

    (first.is_ascii_alphabetic() || first == b'_')
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
        && is_token_path_like(value)
}

fn is_word_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_'
}

fn color_mix_or_var<'a>(path: &'a str, tokens: &'a TokenDictionary) -> Option<Cow<'a, str>> {
    if path.contains('/') {
        return tokens.color_mix_str(path).map(Cow::Owned);
    }
    tokens.get_var_str(path, None).map(Cow::Borrowed)
}

fn token_value<'a>(path: &'a str, tokens: &'a TokenDictionary) -> Option<Cow<'a, str>> {
    let path = split_top_level_slash(path).map_or(path, |(path, _)| path.trim_end());
    tokens.get_str(path, None).map(Cow::Borrowed)
}

fn resolved_token_reference<'a>(
    path: &'a str,
    tokens: &'a TokenDictionary,
    resolution: TokenReferenceResolution,
) -> Option<Cow<'a, str>> {
    match resolution {
        TokenReferenceResolution::CssVar => color_mix_or_var(path, tokens),
        TokenReferenceResolution::Value => token_value(path, tokens),
    }
}

fn expand_token_fallback(
    value: &str,
    tokens: &TokenDictionary,
    resolution: TokenReferenceResolution,
) -> String {
    resolved_token_reference(value, tokens, resolution)
        .unwrap_or_else(|| Cow::Owned(expand_token_references(value, tokens, resolution)))
        .into_owned()
}

fn css_var_with_fallback(value: &str, fallback: &str) -> Option<String> {
    let inner = value.trim().strip_prefix("var(")?.strip_suffix(')')?.trim();
    if inner.contains(',') {
        return Some(value.to_owned());
    }

    Some(format!("var({inner}, {fallback})"))
}

fn find_matching_paren(value: &str) -> Option<usize> {
    let mut depth = 0u32;
    for (index, ch) in value.char_indices() {
        match ch {
            '(' => depth += 1,
            ')' if depth == 0 => return Some(index),
            ')' => depth -= 1,
            _ => {}
        }
    }
    None
}

fn split_token_args(value: &str) -> (&str, Option<&str>) {
    let mut depth = 0u32;
    for (index, ch) in value.char_indices() {
        match ch {
            '(' => depth += 1,
            ')' if depth > 0 => depth -= 1,
            ',' if depth == 0 => return (&value[..index], Some(&value[index + 1..])),
            _ => {}
        }
    }
    (value, None)
}
