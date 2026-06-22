use std::sync::Arc;

use insta::assert_debug_snapshot;
use pandacss_extractor::Literal;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::{bg_value, color_opacity_utility, utility_config};

/// A `background`/`bg` + `color` utility bound to the `colors` category with a
/// `red.300` color token and a `half` opacity token, so opacity modifiers can
/// resolve against the dictionary.
fn color_opacity_with_tokens() -> Utility {
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

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "snapshot-heavy fixture keeps related color opacity assertions together"
)]
fn transform_supports_color_opacity_modifiers() {
    let utility = color_opacity_with_tokens();

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
fn color_opacity_modifier_splits_top_level_slash() {
    let utility = color_opacity_utility();
    assert_eq!(
        bg_value(&utility, "red/40"),
        "color-mix(in oklab, red 40%, transparent)"
    );
}

#[test]
fn color_opacity_modifier_resolves_opacity_token_to_percent() {
    // `half` is an `opacity` token worth `0.5`, so the modifier resolves to 50%.
    let utility = color_opacity_with_tokens();
    assert_eq!(
        bg_value(&utility, "red.300/half"),
        "color-mix(in oklab, var(--colors-red-300) 50%, transparent)"
    );
}

#[test]
fn color_opacity_modifier_ignores_slash_inside_color_function() {
    // `/` inside `rgb(... / a)` is not a modifier — value passes through unchanged.
    let utility = color_opacity_utility();
    assert_eq!(
        bg_value(&utility, "rgb(251 146 60 / 0.3)"),
        "rgb(251 146 60 / 0.3)"
    );
}

#[test]
fn color_opacity_modifier_passes_through_after_color_function() {
    // The tokens-side resolver can't parse `color(display-p3 ...)`, so the value
    // is emitted verbatim instead of producing a `color-mix`.
    let utility = color_opacity_utility();
    assert_eq!(
        bg_value(&utility, "color(display-p3 1 0 0 / 0.5)/40"),
        "color(display-p3 1 0 0 / 0.5)/40"
    );
}

#[test]
fn color_opacity_modifier_passes_through_escaped_and_quoted_slashes() {
    // The resolver rejects these color values, so they pass through unchanged
    // rather than producing a `color-mix`.
    let utility = color_opacity_utility();
    assert_eq!(bg_value(&utility, r"foo\/bar/40"), r"foo\/bar/40");
    assert_eq!(bg_value(&utility, r#"url("/x/y")/40"#), r#"url("/x/y")/40"#);
}

#[test]
fn color_opacity_modifier_passes_through_empty_color_segment() {
    // A leading `/40` has an empty color segment the resolver can't parse.
    let utility = color_opacity_utility();
    assert_eq!(bg_value(&utility, "/40"), "/40");
}

#[test]
fn color_opacity_modifier_passes_through_empty_opacity_segment() {
    // A trailing `red/` has an empty opacity segment the resolver can't parse.
    let utility = color_opacity_utility();
    assert_eq!(bg_value(&utility, "red/"), "red/");
}

#[test]
fn is_invalid_color_opacity_modifier_flags_unresolvable_opacity() {
    // A slash-modified color whose opacity token is unknown can't become a
    // `color-mix`, so it is reported as invalid.
    let utility = color_opacity_with_tokens();
    assert!(utility.is_invalid_color_opacity_modifier("red.300/unknown"));
}

#[test]
fn is_invalid_color_opacity_modifier_accepts_resolvable_modifier() {
    let utility = color_opacity_with_tokens();
    assert!(!utility.is_invalid_color_opacity_modifier("red.300/40"));
    assert!(!utility.is_invalid_color_opacity_modifier("red.300/half"));
}

#[test]
fn is_invalid_color_opacity_modifier_ignores_values_without_modifier() {
    // No top-level slash means there is no opacity modifier to validate.
    let utility = color_opacity_with_tokens();
    assert!(!utility.is_invalid_color_opacity_modifier("red.300"));
}
