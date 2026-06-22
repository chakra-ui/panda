//! Category access: `category_values`, semantic category values, negative
//! category calc values, and `TokenCategory` parsing round-trips.

use crate::common::t;
use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use serde_json::json;

// --- JS parity: format-by-category.test.ts ---

#[test]
fn category_values_grouped_by_category() {
    let dict = TokenDictionary::builder()
        .extend([
            t("colors.red", "#f00", "var(--c-r)", TokenCategory::Colors),
            t("colors.blue", "#00f", "var(--c-b)", TokenCategory::Colors),
            t("sizes.sm", "4px", "var(--s-sm)", TokenCategory::Sizes),
            t("sizes.md", "8px", "var(--s-md)", TokenCategory::Sizes),
        ])
        .build();

    assert_yaml_snapshot!(json!({
        "colors": snapshot_category_values(&dict, &TokenCategory::Colors),
        "sizes": snapshot_category_values(&dict, &TokenCategory::Sizes),
    }), @r##"
    colors:
      blue: var(--c-b)
      red: var(--c-r)
    sizes:
      md: var(--s-md)
      sm: var(--s-sm)
    "##);
}

#[test]
fn semantic_category_values_emit_var_refs() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "blue": {
                        "500": { "value": "#2563eb" }
                    },
                    "brand": {
                        "500": { "value": "#111827" }
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "primary": { "value": "{colors.blue.500}" }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(json!({
        "primary": dict.category_value_str("colors", "primary"),
        "brand_500": dict.category_value_str("colors", "brand.500"),
        "colors": snapshot_category_values(&dict, &TokenCategory::Colors),
    }), @r##"
    primary: var(--colors-primary)
    brand_500: var(--colors-brand-500)
    colors:
      blue.500: var(--colors-blue-500)
      brand.500: var(--colors-brand-500)
      colorPalette: var(--colors-color-palette)
      colorPalette.500: var(--colors-color-palette-500)
      primary: var(--colors-primary)
    "##);
}

#[test]
fn negative_category_values_emit_calc_values() {
    let mut negative = t(
        "spacing.-4",
        "calc(var(--spacing-4) * -1)",
        "",
        TokenCategory::Spacing,
    );
    negative.set_extension("isNegative", "true");

    let dict = TokenDictionary::builder()
        .insert(t(
            "spacing.4",
            "1rem",
            "var(--spacing-4)",
            TokenCategory::Spacing,
        ))
        .insert(negative)
        .build();

    assert_yaml_snapshot!(json!({
        "positive": dict.category_value_str("spacing", "4"),
        "negative": dict.category_value_str("spacing", "-4"),
        "spacing": snapshot_category_values(&dict, &TokenCategory::Spacing),
    }), @r##"
    positive: var(--spacing-4)
    negative: calc(var(--spacing-4) * -1)
    spacing:
      "-4": calc(var(--spacing-4) * -1)
      "4": var(--spacing-4)
    "##);
}

// --- category parsing ---

#[test]
fn category_from_path_segment_known_buckets() {
    assert_eq!(
        TokenCategory::from_path_segment("colors"),
        TokenCategory::Colors
    );
    assert_eq!(
        TokenCategory::from_path_segment("fontSizes"),
        TokenCategory::FontSizes
    );
    assert_eq!(
        TokenCategory::from_path_segment("aspectRatios"),
        TokenCategory::AspectRatios
    );
    assert_eq!(
        TokenCategory::from_path_segment("breakpoints"),
        TokenCategory::Breakpoints
    );
    assert_eq!(
        TokenCategory::from_path_segment("custom"),
        TokenCategory::Other("custom".into())
    );
}

#[test]
fn category_as_str_round_trips_through_path_segment() {
    for cat in [
        TokenCategory::Colors,
        TokenCategory::Sizes,
        TokenCategory::FontSizes,
        TokenCategory::LetterSpacings,
        TokenCategory::AspectRatios,
        TokenCategory::Animations,
        TokenCategory::Blurs,
        TokenCategory::Other("custom".into()),
    ] {
        let roundtrip = TokenCategory::from_path_segment(cat.as_str());
        assert_eq!(cat, roundtrip);
    }
}

fn snapshot_category_values(
    dict: &TokenDictionary,
    category: &TokenCategory,
) -> std::collections::BTreeMap<String, String> {
    dict.category_values(category).into_iter().collect()
}
