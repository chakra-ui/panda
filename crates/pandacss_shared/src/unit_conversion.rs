//! CSS unit helpers ported from `packages/shared/src/unit-conversion.ts`.

use std::borrow::Cow;

const BASE_FONT_SIZE: f64 = 16.0;

/// Convert a CSS length to `rem` using a 16px root font size.
///
/// - `px` → `value / 16 rem`
/// - `rem` → unchanged
/// - `em` → `Nrem` (same numeric factor)
/// - unitless / unknown units → unchanged
#[must_use]
pub fn to_rem(value: &str) -> Cow<'_, str> {
    let value = value.trim();
    let Some(unit_start) = value
        .as_bytes()
        .iter()
        .position(|byte| !byte.is_ascii_digit() && *byte != b'.' && *byte != b'-')
    else {
        return Cow::Borrowed(value);
    };

    let (number, unit) = value.split_at(unit_start);
    if number.is_empty() {
        return Cow::Borrowed(value);
    }

    match unit {
        "px" => {
            let Ok(parsed) = number.parse::<f64>() else {
                return Cow::Borrowed(value);
            };
            let rem = parsed / BASE_FONT_SIZE;
            Cow::Owned(format!("{rem}rem"))
        }
        "em" => Cow::Owned(format!("{number}rem")),
        _ => Cow::Borrowed(value),
    }
}
