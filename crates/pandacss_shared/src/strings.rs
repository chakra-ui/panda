use std::borrow::Cow;

/// Convert a Rust `f64` to the compact string form JavaScript would use
/// for ordinary finite numeric literals in extracted style data.
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

/// `Number.MAX_SAFE_INTEGER + 1`, matching the historical Panda JS
/// serialization boundary for f64 integers.
pub const MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_992.0;

#[must_use]
pub fn is_js_safe_integer(value: f64) -> bool {
    value.is_finite() && value.fract() == 0.0 && value.abs() <= MAX_SAFE_INTEGER
}

/// Uppercase the first Unicode scalar and keep the rest unchanged.
#[must_use]
pub fn capitalize(value: &str) -> Cow<'_, str> {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return Cow::Borrowed(value);
    };

    // Borrow unchanged when the first char already uppercases to itself (the
    // common case for class names) — avoids an allocation.
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

/// `PascalCase` an identifier, treating any non-alphanumeric run as a word
/// break (`button-group` -> `ButtonGroup`). Empty results fall back to `_` so
/// callers always get a valid identifier.
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

/// Coerce a string into a valid JS identifier: non-`[A-Za-z0-9_$]` chars
/// become `_`, and a leading digit is prefixed with `_`. Falls back to `_`.
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

/// Kebab-case a name for use as a file stem: camelCase boundaries and
/// non-alphanumeric runs both become single dashes, no leading/trailing dash
/// (`ButtonGroup` -> `button-group`). Falls back to `_`.
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

/// The closest candidate to `target` by Levenshtein distance, if within an
/// edit distance of 2. Used for "did you mean …?" diagnostics. Ties keep the
/// first candidate seen.
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

/// Standard two-row Levenshtein edit distance over Unicode scalar values.
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn closest_match_suggests_a_near_miss() {
        assert_eq!(
            closest_match("_hovr", ["_hover", "_focus", "_active"]),
            Some("_hover")
        );
    }

    #[test]
    fn closest_match_returns_none_when_nothing_is_close() {
        assert_eq!(closest_match("_zzz", ["_hover", "_focus"]), None);
    }

    #[test]
    fn closest_match_prefers_the_smallest_distance() {
        // "_hoer" is distance 1 from "_hover", 2 from "_focus".
        assert_eq!(closest_match("_hoer", ["_focus", "_hover"]), Some("_hover"));
    }
}
