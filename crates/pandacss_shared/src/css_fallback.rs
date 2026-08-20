//! The `fallback(a, b)` CSS value form: an ordered run of values for one
//! property, written as a single value so it stays one atom and one class.
//!
//! Members are authored most-preferred first, matching `var(--brand, red)`.
//! The stylesheet emits one declaration per member in reverse, because CSS
//! takes the last declaration it understands.
//!
//! Not a real CSS function — the emitter writes the members, never the wrapper.

use std::borrow::Cow;

use crate::important::is_important;

/// The value-form name. `width: fallback(min(60rem, 100%), 75%)`.
pub const FALLBACK_FN: &str = "fallback";

/// A run below two members is not a fallback; one value needs no baseline.
pub const FALLBACK_MIN_MEMBERS: usize = 2;

/// The generated `css.fallback()` joins with this too; differing text would
/// give the same authored run two class names.
pub const FALLBACK_SEPARATOR: &str = ", ";

/// Builds the `fallback(a, b)` text from already-stringified members.
#[must_use]
pub fn format_fallback_value<'a>(members: impl IntoIterator<Item = &'a str>) -> String {
    let mut out = String::from(FALLBACK_FN);
    out.push('(');
    for (index, member) in members.into_iter().enumerate() {
        if index > 0 {
            out.push_str(FALLBACK_SEPARATOR);
        }
        out.push_str(member);
    }
    out.push(')');
    out
}

/// Whether a raw value is written in the `fallback(...)` form.
#[must_use]
pub fn is_fallback_value(value: &str) -> bool {
    let value = value.trim_start();
    value.len() > FALLBACK_FN.len()
        && value.is_char_boundary(FALLBACK_FN.len())
        && value[..FALLBACK_FN.len()].eq_ignore_ascii_case(FALLBACK_FN)
        && value[FALLBACK_FN.len()..].trim_start().starts_with('(')
}

/// Why a value written in the `fallback(...)` form is not a run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FallbackError {
    /// Unbalanced parens, brackets, or quotes.
    Unbalanced,
    /// Fewer than [`FALLBACK_MIN_MEMBERS`] members.
    TooFewMembers,
    /// A member is itself a run.
    Nested,
}

/// Splits `fallback(a, b)` into its members, most-preferred first.
///
/// `None` when the value is not the fallback form or is not a valid run.
/// Commas inside parens, brackets, or quotes belong to the member —
/// `fallback(min(60rem, 100%), 75%)` is two members, not three.
#[must_use]
pub fn parse_fallback_value(value: &str) -> Option<Vec<&str>> {
    is_fallback_value(value)
        .then(|| parse_fallback_run(value).ok())
        .flatten()
}

/// [`parse_fallback_value`] with the reason it failed, for diagnostics.
/// Assumes [`is_fallback_value`] already passed.
///
/// # Errors
/// See [`FallbackError`].
pub fn parse_fallback_run(value: &str) -> Result<Vec<&str>, FallbackError> {
    let value = value.trim();
    let (Some(open), true) = (value.find('('), value.ends_with(')')) else {
        return Err(FallbackError::Unbalanced);
    };
    let inner = &value[open + 1..value.len() - 1];

    let members = split_top_level_commas(inner).ok_or(FallbackError::Unbalanced)?;
    let members: Vec<&str> = members
        .into_iter()
        .map(str::trim)
        .filter(|member| !member.is_empty())
        .collect();
    if members.iter().any(|member| is_fallback_value(member)) {
        return Err(FallbackError::Nested);
    }
    if members.len() < FALLBACK_MIN_MEMBERS {
        return Err(FallbackError::TooFewMembers);
    }
    Ok(members)
}

/// Splits on commas outside any nesting; `None` if the nesting is unbalanced.
fn split_top_level_commas(input: &str) -> Option<Vec<&str>> {
    let mut parts = Vec::new();
    let mut depth = 0_i32;
    let mut quote: Option<char> = None;
    let mut escaped = false;
    let mut start = 0;

    for (index, ch) in input.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        match quote {
            Some(open) => match ch {
                '\\' => escaped = true,
                _ if ch == open => quote = None,
                _ => {}
            },
            None => match ch {
                '\\' => escaped = true,
                '\'' | '"' => quote = Some(ch),
                '(' | '[' | '{' => depth += 1,
                ')' | ']' | '}' => {
                    depth -= 1;
                    if depth < 0 {
                        return None;
                    }
                }
                ',' if depth == 0 => {
                    parts.push(&input[start..index]);
                    start = index + 1;
                }
                _ => {}
            },
        }
    }

    (depth == 0 && quote.is_none()).then(|| {
        parts.push(&input[start..]);
        parts
    })
}

/// Splits a trailing `!important` off a run, leaving members untouched.
/// [`crate::split_important`] takes the first `!` anywhere, which would hoist
/// one member's marker onto every declaration.
#[must_use]
pub fn split_run_important(value: &str) -> (Cow<'_, str>, bool) {
    let trimmed = value.trim_end();
    let Some(close) = trimmed.rfind(')') else {
        return (Cow::Borrowed(value), false);
    };
    let tail = &trimmed[close + 1..];
    if !tail.trim().is_empty() && is_important(tail) {
        return (Cow::Owned(trimmed[..=close].to_owned()), true);
    }
    (Cow::Borrowed(value), false)
}
