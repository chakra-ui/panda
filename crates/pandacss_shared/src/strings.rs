use std::borrow::Cow;

/// `f64` in the compact string form JS uses for finite numeric literals.
#[must_use]
pub fn number_to_js_string(value: f64) -> String {
    if is_js_safe_integer(value) {
        #[allow(clippy::cast_possible_truncation, reason = "bounds checked")]
        return itoa::Buffer::new().format(value as i64).to_owned();
    }
    ryu::Buffer::new().format(value).to_owned()
}

pub fn push_number_to_js_string(out: &mut String, value: f64) {
    if is_js_safe_integer(value) {
        #[allow(clippy::cast_possible_truncation, reason = "bounds checked")]
        out.push_str(itoa::Buffer::new().format(value as i64));
        return;
    }
    out.push_str(ryu::Buffer::new().format(value));
}

/// `Number.MAX_SAFE_INTEGER + 1` — Panda's JS f64-integer serialization boundary.
pub const MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_992.0;

#[must_use]
pub fn is_js_safe_integer(value: f64) -> bool {
    value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INTEGER
}

#[must_use]
pub fn capitalize(value: &str) -> Cow<'_, str> {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return Cow::Borrowed(value);
    };

    // Skip the allocation when the first char already uppercases to itself.
    let mut uppercase = first.to_uppercase();
    let Some(first_upper) = uppercase.next() else {
        return Cow::Borrowed(value);
    };
    if first_upper == first && uppercase.next().is_none() {
        return Cow::Borrowed(value);
    }

    let mut out = String::with_capacity(value.len());
    out.extend(first.to_uppercase());
    out.push_str(chars.as_str());
    Cow::Owned(out)
}

/// `button-group` -> `ButtonGroup`. Any non-alphanumeric run is a word break.
/// Falls back to `_` on an empty result so callers always get an identifier.
#[must_use]
pub fn pascal_case(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut uppercase = true;

    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            if uppercase {
                out.push(ch.to_ascii_uppercase());
                uppercase = false;
            } else {
                out.push(ch);
            }
        } else {
            uppercase = true;
        }
    }

    if out.is_empty() { "_".into() } else { out }
}

/// Coerces `value` into a valid JS identifier: non-`[A-Za-z0-9_$]` chars
/// become `_`, a leading digit gets a `_` prefix. Falls back to `_`.
#[must_use]
pub fn js_ident(value: &str) -> String {
    let mut out = String::with_capacity(value.len());

    for (index, ch) in value.chars().enumerate() {
        if ch.is_ascii_alphanumeric() || ch == '_' || ch == '$' {
            if index == 0 && ch.is_ascii_digit() {
                out.push('_');
            }
            out.push(ch);
        } else {
            out.push('_');
        }
    }

    if out.is_empty() { "_".into() } else { out }
}

/// `ButtonGroup` -> `button-group`. camelCase boundaries and non-alphanumeric
/// runs both collapse to a single dash, no leading/trailing dash. Falls back to `_`.
#[must_use]
pub fn file_stem(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut prev_dash = false;

    for ch in value.chars() {
        if ch.is_ascii_uppercase() {
            if !out.is_empty() && !prev_dash {
                out.push('-');
            }
            out.push(ch.to_ascii_lowercase());
            prev_dash = false;
        } else if ch.is_ascii_alphanumeric() {
            out.push(ch);
            prev_dash = false;
        } else if !prev_dash && !out.is_empty() {
            out.push('-');
            prev_dash = true;
        }
    }

    if out.ends_with('-') {
        out.pop();
    }

    if out.is_empty() { "_".into() } else { out }
}

/// Closest candidate to `target` for "did you mean …?" diagnostics: smallest
/// Levenshtein distance within 2, first seen wins ties.
#[must_use]
pub fn closest_match<'a>(
    target: &str,
    candidates: impl IntoIterator<Item = &'a str>,
) -> Option<&'a str> {
    const MAX_DISTANCE: usize = 2;
    let mut best: Option<(&str, usize)> = None;

    for candidate in candidates {
        let distance = levenshtein(target, candidate);
        if distance <= MAX_DISTANCE
            && best.is_none_or(|(_, best_distance)| distance < best_distance)
        {
            best = Some((candidate, distance));
        }
    }

    best.map(|(candidate, _)| candidate)
}

/// Two-row Levenshtein edit distance over Unicode scalar values.
fn levenshtein(a: &str, b: &str) -> usize {
    let b_chars: Vec<char> = b.chars().collect();
    let mut prev: Vec<usize> = (0..=b_chars.len()).collect();
    let mut curr = vec![0usize; b_chars.len() + 1];

    for (i, a_char) in a.chars().enumerate() {
        curr[0] = i + 1;
        for (j, &b_char) in b_chars.iter().enumerate() {
            let cost = usize::from(a_char != b_char);
            curr[j + 1] = (prev[j + 1] + 1).min(curr[j] + 1).min(prev[j] + cost);
        }
        std::mem::swap(&mut prev, &mut curr);
    }

    prev[b_chars.len()]
}

/// `backgroundColor` -> `background-color`. `--foo` custom properties pass
/// through; a leading `ms` vendor segment becomes `-ms-`, not `-Ms-`.
#[must_use]
pub fn hyphenate_property(property: &str) -> String {
    if property.starts_with("--") {
        return property.to_owned();
    }

    let mut out = String::with_capacity(property.len() + 4);
    for ch in property.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }

    if let Some(rest) = out.strip_prefix("ms-") {
        let mut prefixed = String::with_capacity(out.len() + 1);
        prefixed.push_str("-ms-");
        prefixed.push_str(rest);
        return prefixed;
    }

    out
}

/// Index of the closing `)` for a group, skipping balanced nested `(...)`.
/// `value` must start just after the opening `(`.
#[must_use]
pub fn find_matching_paren(value: &str) -> Option<usize> {
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
