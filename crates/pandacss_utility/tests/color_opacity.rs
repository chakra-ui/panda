use std::sync::Arc;

use insta::assert_debug_snapshot;
use pandacss_literal::Literal;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

/// `bg` and `color` utilities on the `colors` category, with a `red.300` color
/// token and a `half` (0.5) opacity token.
fn color_utilities() -> Utility {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.300",
            "#fca5a5",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "opacity.half",
            "0.5",
            "var(--opacity-half)",
            TokenCategory::Opacity,
        ))
        .build();
    Utility::from_config_with_options(
        &utility_config(json!({
            "background": {
                "shorthand": "bg",
                "className": "bg",
                "values": "colors"
            },
            "color": {
                "className": "c",
                "values": "colors"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    )
}

fn bg_value(utility: &Utility, value: &str) -> String {
    let result = utility
        .transform("bg", &Literal::String(value.into()))
        .expect("transform result");
    match result.styles {
        Literal::Object(entries) => match &entries[0].1 {
            Literal::String(value) => value.clone(),
            other => panic!("expected string value, got {other:?}"),
        },
        other => panic!("expected object styles, got {other:?}"),
    }
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "snapshot-heavy fixture keeps related color opacity assertions together"
)]
fn slash_opacity_modifiers_become_color_mix() {
    let utility = color_utilities();

    let direct_token = utility.transform("bg", &Literal::String("red.300/40".into()));
    let direct_raw = utility.transform("bg", &Literal::String("red/30".into()));
    let curly = utility.transform("color", &Literal::String("{colors.red.300/40}".into()));
    let token_fn = utility.transform("bg", &Literal::String("token(colors.red.300/half)".into()));

    assert_debug_snapshot!(
        (direct_token, direct_raw, curly, token_fn),
        @r#"
    (
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "bg_red.300/40",
                styles: Object(
                    [
                        (
                            "background",
                            String(
                                "color-mix(in oklab, var(--colors-red-300) 40%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "bg_red/30",
                styles: Object(
                    [
                        (
                            "background",
                            String(
                                "color-mix(in oklab, red 30%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "c_{colors.red.300/40}",
                styles: Object(
                    [
                        (
                            "color",
                            String(
                                "color-mix(in oklab, var(--colors-red-300) 40%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
        Some(
            UtilityTransformResult {
                layer: None,
                class_name: "bg_token(colors.red.300/half)",
                styles: Object(
                    [
                        (
                            "background",
                            String(
                                "color-mix(in oklab, var(--colors-red-300) 50%, transparent)",
                            ),
                        ),
                    ],
                ),
            },
        ),
    )
    "#);
}

#[test]
fn raw_color_with_percent_modifier_becomes_color_mix() {
    let utility = color_utilities();
    assert_eq!(
        bg_value(&utility, "red/40"),
        "color-mix(in oklab, red 40%, transparent)"
    );
}

#[test]
fn opacity_token_modifier_resolves_to_percent() {
    let utility = color_utilities();
    assert_eq!(
        bg_value(&utility, "red.300/half"),
        "color-mix(in oklab, var(--colors-red-300) 50%, transparent)"
    );
}

#[test]
fn slash_inside_rgb_function_is_not_a_modifier() {
    // `/` inside `rgb(... / a)` is not a modifier — value passes through unchanged.
    let utility = color_utilities();
    assert_eq!(
        bg_value(&utility, "rgb(251 146 60 / 0.3)"),
        "rgb(251 146 60 / 0.3)"
    );
}

#[test]
fn modifier_after_color_function_passes_through() {
    // The tokens-side resolver can't parse `color(display-p3 ...)`, so the value
    // is emitted verbatim instead of producing a `color-mix`.
    let utility = color_utilities();
    assert_eq!(
        bg_value(&utility, "color(display-p3 1 0 0 / 0.5)/40"),
        "color(display-p3 1 0 0 / 0.5)/40"
    );
}

#[test]
fn escaped_and_quoted_slashes_pass_through() {
    // The resolver rejects these color values, so they pass through unchanged
    // rather than producing a `color-mix`.
    let utility = color_utilities();
    assert_eq!(bg_value(&utility, r"foo\/bar/40"), r"foo\/bar/40");
    assert_eq!(bg_value(&utility, r#"url("/x/y")/40"#), r#"url("/x/y")/40"#);
}

#[test]
fn modifier_without_color_passes_through() {
    // A leading `/40` has an empty color segment the resolver can't parse.
    let utility = color_utilities();
    assert_eq!(bg_value(&utility, "/40"), "/40");
}

#[test]
fn color_with_trailing_slash_passes_through() {
    // A trailing `red/` has an empty opacity segment the resolver can't parse.
    let utility = color_utilities();
    assert_eq!(bg_value(&utility, "red/"), "red/");
}

#[test]
fn unknown_opacity_token_is_an_invalid_modifier() {
    // A slash-modified color whose opacity token is unknown can't become a
    // `color-mix`, so it is reported as invalid.
    let utility = color_utilities();
    assert!(utility.is_invalid_color_opacity_modifier("red.300/unknown"));
}

#[test]
fn percent_and_opacity_token_modifiers_are_valid() {
    let utility = color_utilities();
    assert!(!utility.is_invalid_color_opacity_modifier("red.300/40"));
    assert!(!utility.is_invalid_color_opacity_modifier("red.300/half"));
}

#[test]
fn color_without_modifier_is_not_flagged() {
    // No top-level slash means there is no opacity modifier to validate.
    let utility = color_utilities();
    assert!(!utility.is_invalid_color_opacity_modifier("red.300"));
}
