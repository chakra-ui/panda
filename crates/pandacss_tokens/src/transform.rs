//! Serialize typed token values (shadows, borders, gradients, assets, …) to
//! their final CSS string form. Ports the per-category transformers from
//! `packages/core`'s token pipeline; output must match the JS strings byte-for-byte.

use pandacss_config::{
    AssetType, AssetValue, BorderStyle, BorderValue, EasingValue, FontValue, GradientStops,
    GradientValue, Shadow, ShadowValue, StringOrNumber,
};
use pandacss_shared::{number_to_js_string, push_number_to_js_string};

use crate::svg::svg_to_data_uri;

pub(crate) trait TokenValueString {
    fn to_token_string(&self) -> String;
}

impl TokenValueString for String {
    fn to_token_string(&self) -> String {
        self.clone()
    }
}

impl TokenValueString for StringOrNumber {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Number(value) => number_to_js_string(*value),
        }
    }
}

impl TokenValueString for FontValue {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Array(values) => join_strings(values, ", "),
        }
    }
}

impl TokenValueString for ShadowValue {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::StringArray(values) => join_strings(values, ", "),
            Self::Shadow(value) => shadow_to_string(value),
            Self::ShadowArray(values) => {
                let mut out = String::new();
                for (index, value) in values.iter().enumerate() {
                    if index > 0 {
                        out.push_str(", ");
                    }
                    out.push_str(&shadow_to_string(value));
                }
                out
            }
        }
    }
}

impl TokenValueString for BorderValue {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Border(value) => {
                let width = to_unit(&value.width);
                let style = border_style_to_str(&value.style);
                let mut out =
                    String::with_capacity(width.len() + style.len() + value.color.len() + 2);
                out.push_str(&width);
                out.push(' ');
                out.push_str(style);
                out.push(' ');
                out.push_str(&value.color);
                out
            }
        }
    }
}

impl TokenValueString for EasingValue {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Array(values) => {
                let mut out = String::from("cubic-bezier(");
                for (index, value) in values.iter().enumerate() {
                    if index > 0 {
                        out.push_str(", ");
                    }
                    push_number_to_js_string(&mut out, *value);
                }
                out.push(')');
                out
            }
        }
    }
}

impl TokenValueString for GradientValue {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Gradient(value) => {
                let placement = value.placement.to_token_string();
                let mut out = String::new();
                out.push_str(&value.r#type);
                out.push_str("-gradient(");
                out.push_str(&placement);
                out.push_str(", ");
                match &value.stops {
                    GradientStops::Strings(values) => {
                        for (index, value) in values.iter().enumerate() {
                            if index > 0 {
                                out.push_str(", ");
                            }
                            out.push_str(value);
                        }
                    }
                    GradientStops::Stops(values) => {
                        for (index, stop) in values.iter().enumerate() {
                            if index > 0 {
                                out.push_str(", ");
                            }
                            out.push_str(&stop.color);
                            out.push(' ');
                            push_number_to_js_string(&mut out, stop.position);
                            out.push_str("px");
                        }
                    }
                }
                out.push(')');
                out
            }
        }
    }
}

impl TokenValueString for AssetValue {
    fn to_token_string(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Asset(value) => match value.r#type {
                AssetType::Url => quoted_url(&value.value),
                AssetType::Svg => quoted_url(&svg_to_data_uri(&value.value)),
            },
        }
    }
}

fn join_strings(values: &[String], separator: &str) -> String {
    let mut out = String::new();
    for (index, value) in values.iter().enumerate() {
        if index > 0 {
            out.push_str(separator);
        }
        out.push_str(value);
    }
    out
}

fn shadow_to_string(value: &Shadow) -> String {
    let offset_x = px(&value.offset_x);
    let offset_y = px(&value.offset_y);
    let blur = px(&value.blur);
    let spread = px(&value.spread);
    let mut out = String::with_capacity(
        offset_x.len() + offset_y.len() + blur.len() + spread.len() + value.color.len() + 12,
    );
    if value.inset.unwrap_or(false) {
        // Matches the JS transformer, which stores "inset " before joining
        // the parts with spaces.
        out.push_str("inset  ");
    }
    out.push_str(&offset_x);
    out.push(' ');
    out.push_str(&offset_y);
    out.push(' ');
    out.push_str(&blur);
    out.push(' ');
    out.push_str(&spread);
    out.push(' ');
    out.push_str(&value.color);
    out
}

fn px(value: &StringOrNumber) -> String {
    match value {
        StringOrNumber::String(value) => value.clone(),
        StringOrNumber::Number(value) => {
            let mut out = number_to_js_string(*value);
            out.push_str("px");
            out
        }
    }
}

/// Coerce a border-width value to a CSS length. Unlike [`px`], a string that
/// already carries a unit (or a token reference) passes through untouched;
/// only bare numbers get `px` appended.
fn to_unit(value: &StringOrNumber) -> String {
    match value {
        StringOrNumber::Number(value) => {
            let mut out = number_to_js_string(*value);
            out.push_str("px");
            out
        }
        StringOrNumber::String(value) if has_reference(value) || is_css_unit(value) => {
            value.clone()
        }
        StringOrNumber::String(value) => {
            let mut out = String::with_capacity(value.len() + 2);
            out.push_str(value);
            out.push_str("px");
            out
        }
    }
}

fn border_style_to_str(value: &BorderStyle) -> &'static str {
    match value {
        BorderStyle::Dashed => "dashed",
        BorderStyle::Dotted => "dotted",
        BorderStyle::Double => "double",
        BorderStyle::Groove => "groove",
        BorderStyle::Hidden => "hidden",
        BorderStyle::Inset => "inset",
        BorderStyle::None => "none",
        BorderStyle::Outset => "outset",
        BorderStyle::Ridge => "ridge",
        BorderStyle::Solid => "solid",
    }
}

fn quoted_url(value: &str) -> String {
    let mut out = String::with_capacity(value.len() + 7);
    out.push_str("url(\"");
    out.push_str(value);
    out.push_str("\")");
    out
}

fn has_reference(value: &str) -> bool {
    value.contains('{') || value.contains("token(")
}

/// Heuristic: does `value` already end in a unit? `0` counts; otherwise there
/// must be a trailing alphabetic/`%` run after the last digit (`12px`, `50%`).
fn is_css_unit(value: &str) -> bool {
    let value = value.trim();
    if value == "0" {
        return true;
    }

    let Some(last_digit_index) = value
        .char_indices()
        .rev()
        .find_map(|(index, ch)| ch.is_ascii_digit().then_some(index))
    else {
        return false;
    };

    value[last_digit_index + 1..]
        .chars()
        .any(|ch| ch.is_ascii_alphabetic() || ch == '%')
}
