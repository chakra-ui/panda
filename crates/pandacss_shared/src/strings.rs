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

#[must_use]
pub fn dash_case(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
}

#[must_use]
pub fn escape_css_var_name(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric()
            || ch == '_'
            || ch == '-'
            || ('\u{0081}'..='\u{ffff}').contains(&ch)
        {
            out.push(ch);
        } else {
            out.push('\\');
            out.push(ch);
        }
    }
    out
}
