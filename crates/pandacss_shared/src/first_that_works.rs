//! The `firstThatWorks(a, b)` CSS value form: an ordered run of values for one
//! property, written as a single value so it stays one atom and one class.
//!
//! Members are authored most-preferred first, matching `var(--brand, red)`.
//! The stylesheet emits one declaration per member in reverse, because CSS
//! takes the last declaration it understands.
//!
//! Not a real CSS function — the emitter writes the members, never the wrapper.

use std::borrow::Cow;

use crate::important::is_important;

/// The value-form name. `width: firstThatWorks(min(60rem, 100%), 75%)`.
pub const FIRST_THAT_WORKS_FN: &str = "firstThatWorks";

/// A run below two members is not a fallback; one value needs no baseline.
pub const FIRST_THAT_WORKS_MIN_MEMBERS: usize = 2;

/// The generated `firstThatWorks()` joins with this too; differing text would
/// give the same authored run two class names.
pub const FIRST_THAT_WORKS_SEPARATOR: &str = ", ";

/// Builds the `firstThatWorks(a, b)` text from already-stringified members.
#[must_use]
pub fn format_first_that_works<'a>(members: impl IntoIterator<Item = &'a str>) -> String {
    let mut out = String::from(FIRST_THAT_WORKS_FN);
    out.push('(');
    for (index, member) in members.into_iter().enumerate() {
        if index > 0 {
            out.push_str(FIRST_THAT_WORKS_SEPARATOR);
        }
        out.push_str(member);
    }
    out.push(')');
    out
}

/// Whether a raw value is written in the `firstThatWorks(...)` form.
#[must_use]
pub fn is_first_that_works_value(value: &str) -> bool {
    let value = value.trim_start();
    value.len() > FIRST_THAT_WORKS_FN.len()
        && value.is_char_boundary(FIRST_THAT_WORKS_FN.len())
        && value[..FIRST_THAT_WORKS_FN.len()].eq_ignore_ascii_case(FIRST_THAT_WORKS_FN)
        && value[FIRST_THAT_WORKS_FN.len()..]
            .trim_start()
            .starts_with('(')
}

/// Why a value written in the `firstThatWorks(...)` form is not a run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FirstThatWorksError {
    /// Unbalanced parens, brackets, or quotes.
    Unbalanced,
    /// Fewer than [`FIRST_THAT_WORKS_MIN_MEMBERS`] members.
    TooFewMembers,
    /// A member is itself a run.
    Nested,
}

/// Splits `firstThatWorks(a, b)` into its members, most-preferred first.
///
/// `None` when the value is not the fallback form or is not a valid run.
/// Commas inside parens, brackets, or quotes belong to the member —
/// `firstThatWorks(min(60rem, 100%), 75%)` is two members, not three.
#[must_use]
pub fn parse_first_that_works_value(value: &str) -> Option<Vec<&str>> {
    is_first_that_works_value(value)
        .then(|| parse_first_that_works_run(value).ok())
        .flatten()
}

/// [`parse_first_that_works_value`] with the reason it failed, for diagnostics.
/// Assumes [`is_first_that_works_value`] already passed.
///
/// # Errors
/// See [`FirstThatWorksError`].
pub fn parse_first_that_works_run(value: &str) -> Result<Vec<&str>, FirstThatWorksError> {
    let value = value.trim();
    let (Some(open), true) = (value.find('('), value.ends_with(')')) else {
        return Err(FirstThatWorksError::Unbalanced);
    };
    let inner = &value[open + 1..value.len() - 1];

    let members = split_top_level_commas(inner).ok_or(FirstThatWorksError::Unbalanced)?;
    let members: Vec<&str> = members
        .into_iter()
        .map(str::trim)
        .filter(|member| !member.is_empty())
        .collect();
    if members
        .iter()
        .any(|member| is_first_that_works_value(member))
    {
        return Err(FirstThatWorksError::Nested);
    }
    if members.len() < FIRST_THAT_WORKS_MIN_MEMBERS {
        return Err(FirstThatWorksError::TooFewMembers);
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
