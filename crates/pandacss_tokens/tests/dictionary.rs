//! Lookup-view tests for the tokens crate.
//!
//! Mirrors scenarios from the JS `packages/token-dictionary` test suite so
//! we don't drift from its lookup contract:
//! - `__tests__/format-flat.test.ts` → flat path → var map
//! - `__tests__/format-by-category.test.ts` → category → value map
//! - `__tests__/format-vars.test.ts` → reverse var → name
//! - `__tests__/colors.test.ts` → category iteration on real-ish data
//! - `__tests__/semantic-token.test.ts` → conditional vs base precedence
//! - implicit deprecation / extension tests
//!
//! UserConfig-derived construction now lives in this crate so project/system
//! can treat tokens as an internal compiled domain model.

use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use serde_json::json;

fn t(path: &str, value: &str, var: &str, category: TokenCategory) -> Token {
    Token::new(path, value, var, category)
}

// --- core lookup ---

#[test]
fn empty_dictionary_is_inert() {
    let dict = TokenDictionary::new();
    assert!(dict.is_empty());
    assert_yaml_snapshot!(json!({
        "len": dict.len(),
        "missing": dict.get("colors.red.500", None),
        "fallback": dict.get("colors.red.500", Some("#000")),
    }), @r##"
    len: 0
    missing: ~
    fallback: "#000"
    "##);
}

#[test]
fn basic_get_and_get_var() {
    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    assert_yaml_snapshot!(json!({
        "value": dict.get("colors.red.500", None),
        "var": dict.get_var("colors.red.500", None),
    }), @r##"
    value: "#ef4444"
    var: var(--colors-red-500)
    "##);
}

#[test]
fn fallback_used_when_path_missing() {
    let dict = TokenDictionary::new();
    assert_yaml_snapshot!(json!({
        "value": dict.get("colors.red.500", Some("#000")),
        "var": dict.get_var("colors.red.500", Some("var(--fallback)")),
    }), @r##"
    value: "#000"
    var: var(--fallback)
    "##);
}

// --- JS parity: format-flat.test.ts ---

#[test]
fn flat_path_to_var_map_matches_js() {
    // Adapted from packages/token-dictionary/__tests__/format-flat.test.ts.
    // The JS test builds a colors object with red/blue/green/pink and
    // asserts `view.values` is `path → var(--colors-…)`. We assemble the
    // same shape and assert path → var via the dictionary's var index.
    let dict = TokenDictionary::builder()
        .extend([
            t(
                "colors.red",
                "#ff0000",
                "var(--colors-red)",
                TokenCategory::Colors,
            ),
            t(
                "colors.blue",
                "#0000ff",
                "var(--colors-blue)",
                TokenCategory::Colors,
            ),
            t(
                "colors.green",
                "#00ff00",
                "var(--colors-green)",
                TokenCategory::Colors,
            ),
            t(
                "colors.pink.50",
                "#ff0000",
                "var(--colors-pink-50)",
                TokenCategory::Colors,
            ),
            t(
                "colors.pink.100",
                "#0000ff",
                "var(--colors-pink-100)",
                TokenCategory::Colors,
            ),
        ])
        .build();

    assert_yaml_snapshot!(snapshot_token_vars(&dict), @r##"
    colors.blue: var(--colors-blue)
    colors.green: var(--colors-green)
    colors.pink.100: var(--colors-pink-100)
    colors.pink.50: var(--colors-pink-50)
    colors.red: var(--colors-red)
    "##);
}

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
fn semantic_token_reference_expands_to_var_not_value() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "brand": {
                        "500": { "value": "#111827" }
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "primary": { "value": "{colors.brand.500}" }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_eq!(
        dict.get_str("colors.primary", None),
        Some("var(--colors-brand-500)")
    );
    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.brand.500: "#111827"
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.500: var(--colors-color-palette-500)
    colors.primary: var(--colors-brand-500)
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

#[test]
fn color_mix_resolves_token_and_opacity_modifiers() {
    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.red.300",
            "#fca5a5",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .insert(t(
            "opacity.half",
            "0.5",
            "var(--opacity-half)",
            TokenCategory::Opacity,
        ))
        .build();

    assert_yaml_snapshot!(json!({
        "token_percent": dict.color_mix_str("colors.red.300/40"),
        "token_opacity": dict.color_mix_str("colors.red.300/half"),
        "raw_color": dict.color_mix_str("red/30"),
        "invalid": dict.color_mix_str("colors.red.300/nope"),
    }), @r##"
    token_percent: "color-mix(in srgb, var(--colors-red-300) 40%, transparent)"
    token_opacity: "color-mix(in srgb, var(--colors-red-300) 50%, transparent)"
    raw_color: "color-mix(in srgb, red 30%, transparent)"
    invalid: ~
    "##);
}

// --- JS parity: format-vars.test.ts (reverse var lookup) ---

#[test]
fn reverse_var_lookup() {
    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();
    let token = dict
        .token_by_var("var(--colors-red-500)")
        .expect("reverse lookup");
    assert_yaml_snapshot!(json!({
        "path": token.path.as_ref(),
        "value": token.value.as_ref(),
        "missing": dict.token_by_var("var(--nonexistent)").is_some(),
    }), @r##"
    path: colors.red.500
    value: "#ef4444"
    missing: false
    "##);
    assert!(dict.token_by_var("var(--nonexistent)").is_none());
}

// --- JS parity: semantic-token.test.ts (conditional precedence) ---

#[test]
fn unconditional_token_wins_over_conditional_via_get() {
    // JS view's `get()` returns the base value; conditional tokens are
    // surfaced via the condition map. Same shape here.
    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.bg",
            "#fff",
            "var(--colors-bg)",
            TokenCategory::Colors,
        ))
        .insert(
            t(
                "colors.bg",
                "#000",
                "var(--colors-bg)",
                TokenCategory::Colors,
            )
            .with_condition("_dark"),
        )
        .build();
    // The dark variant is still reachable through the conditional lookup.
    let dark = dict
        .token_with_condition("colors.bg", "_dark")
        .expect("conditional present");
    assert_yaml_snapshot!(json!({
        "base": dict.get("colors.bg", None),
        "dark": dark.value.as_ref(),
    }), @r##"
    base: "#fff"
    dark: "#000"
    "##);
}

#[test]
fn conditional_only_token_is_reachable_via_token() {
    // JS would expose this through the condition map even though `get()`
    // also returns its value (since there's no base to prefer).
    let dict = TokenDictionary::builder()
        .insert(
            t(
                "colors.accent",
                "tomato",
                "var(--colors-accent)",
                TokenCategory::Colors,
            )
            .with_condition("_dark"),
        )
        .build();
    let token = dict.token("colors.accent").expect("reachable");
    assert_yaml_snapshot!(json!({
        "condition": token.condition.as_deref(),
        "value": dict.get("colors.accent", None),
    }), @r##"
    condition: _dark
    value: tomato
    "##);
}

#[test]
fn distinct_conditions_are_enumerated() {
    let dict = TokenDictionary::builder()
        .insert(t("colors.bg", "#fff", "v", TokenCategory::Colors))
        .insert(t("colors.bg", "#000", "v", TokenCategory::Colors).with_condition("_dark"))
        .insert(t("colors.fg", "#000", "v", TokenCategory::Colors).with_condition("_dark"))
        .insert(t("colors.fg", "#999", "v", TokenCategory::Colors).with_condition("_hover"))
        .build();

    let conds: Vec<&str> = dict
        .conditions()
        .iter()
        .map(std::convert::AsRef::as_ref)
        .collect();
    assert_yaml_snapshot!(conds, @r##"
    - _dark
    - _hover
    "##);
}

#[test]
fn iter_condition_filters_tokens() {
    let dict = TokenDictionary::builder()
        .insert(t("colors.bg", "#fff", "v", TokenCategory::Colors))
        .insert(t("colors.bg", "#000", "v", TokenCategory::Colors).with_condition("_dark"))
        .insert(t("colors.fg", "#fff", "v", TokenCategory::Colors).with_condition("_dark"))
        .build();

    let dark_paths: Vec<&str> = dict
        .iter_condition("_dark")
        .map(|t| t.path.as_ref())
        .collect();
    assert_yaml_snapshot!(dark_paths, @r##"
    - colors.bg
    - colors.fg
    "##);
}

// --- iteration ---

#[test]
fn iter_preserves_insertion_order() {
    let dict = TokenDictionary::builder()
        .insert(t("a", "1", "v1", TokenCategory::Other("x".into())))
        .insert(t("b", "2", "v2", TokenCategory::Other("x".into())))
        .insert(t("c", "3", "v3", TokenCategory::Other("x".into())))
        .build();
    let paths: Vec<&str> = dict.iter().map(|t| t.path.as_ref()).collect();
    assert_yaml_snapshot!(paths, @r##"
    - a
    - b
    - c
    "##);
}

#[test]
fn iter_category_filters_by_category() {
    let dict = TokenDictionary::builder()
        .insert(t("colors.red.500", "#ef4444", "v", TokenCategory::Colors))
        .insert(t("sizes.sm", "4px", "v", TokenCategory::Sizes))
        .insert(t("colors.blue.500", "#3b82f6", "v", TokenCategory::Colors))
        .build();
    let color_paths: Vec<&str> = dict
        .iter_category(&TokenCategory::Colors)
        .map(|t| t.path.as_ref())
        .collect();
    assert_yaml_snapshot!(color_paths, @r##"
    - colors.red.500
    - colors.blue.500
    "##);
}

// --- deprecation ---

#[test]
fn deprecated_paths_are_flagged() {
    let dict = TokenDictionary::builder()
        .insert(t("colors.red", "#f00", "v", TokenCategory::Colors).deprecated())
        .insert(t("colors.blue", "#00f", "v", TokenCategory::Colors))
        .build();
    assert!(dict.is_deprecated("colors.red"));
    assert!(!dict.is_deprecated("colors.blue"));
    assert!(!dict.is_deprecated("colors.fake"));
    let deprecated_paths: Vec<&str> = dict
        .deprecated_paths()
        .iter()
        .map(std::convert::AsRef::as_ref)
        .collect();
    assert_yaml_snapshot!(json!({
        "red": dict.is_deprecated("colors.red"),
        "blue": dict.is_deprecated("colors.blue"),
        "fake": dict.is_deprecated("colors.fake"),
        "paths": deprecated_paths,
    }), @r##"
    red: true
    blue: false
    fake: false
    paths:
      - colors.red
    "##);
}

// --- extensions / metadata ---

#[test]
fn description_and_extensions_round_trip() {
    let mut token = t(
        "colors.brand",
        "#123456",
        "var(--colors-brand)",
        TokenCategory::Colors,
    )
    .with_description("Primary brand color");
    token.set_extension("theme", "light");

    let dict = TokenDictionary::builder().insert(token).build();
    let got = dict.token("colors.brand").unwrap();
    assert_yaml_snapshot!(json!({
        "description": got.description.as_deref(),
        "theme": got.extension("theme"),
        "missing": got.extension("missing"),
    }), @r##"
    description: Primary brand color
    theme: light
    missing: ~
    "##);
}

#[test]
fn serde_roundtrip_rebuilds_indexes() {
    // Regression for the reviewer-flagged hazard: a deserialized
    // dictionary must come back with working path/var/category indexes,
    // not silently empty ones. Our custom Deserialize routes through the
    // builder so the indexes are always in sync.
    let original = TokenDictionary::builder()
        .insert(t(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .insert(t(
            "sizes.sm",
            "4px",
            "var(--sizes-sm)",
            TokenCategory::Sizes,
        ))
        .build();
    let wire = serde_json::to_string(&original).expect("serialize");
    let restored: TokenDictionary = serde_json::from_str(&wire).expect("deserialize");

    assert_yaml_snapshot!(json!({
        "value": restored.get("colors.red.500", None),
        "var": restored.get_var("sizes.sm", None),
        "reverseVar": restored.token_by_var("var(--colors-red-500)").is_some(),
        "colorCount": restored.iter_category(&TokenCategory::Colors).count(),
        "len": restored.len(),
        "originalLen": original.len(),
    }), @r##"
    value: "#ef4444"
    var: var(--sizes-sm)
    reverseVar: true
    colorCount: 1
    len: 2
    originalLen: 2
    "##);
}

#[test]
fn builder_push_supports_imperative_construction() {
    // Mirror what a JS bridge or a loop-built dictionary looks like:
    // hold a `&mut builder` and `push` tokens without taking ownership
    // each iteration.
    let mut builder = TokenDictionary::builder();
    for (path, value) in [("colors.red", "#f00"), ("colors.blue", "#00f")] {
        builder.push(t(path, value, "v", TokenCategory::Colors));
    }
    let dict = builder.build();
    assert_yaml_snapshot!(json!({
        "len": dict.len(),
        "red": dict.get("colors.red", None),
        "tokens": snapshot_tokens(&dict),
    }), @r##"
    len: 2
    red: "#f00"
    tokens:
      - path: colors.red
        value: "#f00"
        var: v
        category: colors
        condition: ~
        deprecated: false
        description: ~
      - path: colors.blue
        value: "#00f"
        var: v
        category: colors
        condition: ~
        deprecated: false
        description: ~
    "##);
}

#[test]
fn tokens_without_extensions_have_no_allocation() {
    // Empty-extension case must not allocate a backing map. `is_none()`
    // confirms the niche-optimized slot is preserved.
    let token = t("colors.red", "#f00", "v", TokenCategory::Colors);
    assert!(token.extensions.is_none());
    assert!(token.extension("anything").is_none());
    assert_eq!(token.extension_entries().count(), 0);
}

#[test]
fn get_str_returns_borrows_without_cloning() {
    // Compile-time assertion: get_str/get_var_str hand back &str slices
    // that the caller can use without owning the buffer.
    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();
    let v: Option<&str> = dict.get_str("colors.red.500", None);
    let var: Option<&str> = dict.get_var_str("colors.red.500", None);
    // Fallback path returns the supplied borrow verbatim.
    let fallback: Option<&str> = dict.get_str("colors.missing", Some("#000"));
    assert_yaml_snapshot!(json!({
        "value": v,
        "var": var,
        "fallback": fallback,
    }), @r##"
    value: "#ef4444"
    var: var(--colors-red-500)
    fallback: "#000"
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

// --- extend_flat convenience ---

#[test]
fn extend_flat_builds_a_usable_dictionary() {
    let values: Vec<(&str, &str)> = vec![("colors.red.500", "#ef4444"), ("sizes.sm", "4px")];
    let vars: std::collections::HashMap<String, String> = [
        ("colors.red.500".to_string(), "var(--c-r-5)".to_string()),
        ("sizes.sm".to_string(), "var(--sz-sm)".to_string()),
    ]
    .into_iter()
    .collect();

    let dict = TokenDictionary::builder()
        .extend_flat(values, &vars)
        .build();

    assert_yaml_snapshot!(json!({
        "red": dict.get("colors.red.500", None),
        "sizeVar": dict.get_var("sizes.sm", None),
        "redCategory": dict.token("colors.red.500").map(|t| t.category.as_str()),
    }), @r##"
    red: "#ef4444"
    sizeVar: var(--sz-sm)
    redCategory: colors
    "##);
}

// --- config-derived construction ---

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "fixture-heavy config test keeps related token assertions together"
)]
fn from_config_collects_theme_tokens_semantic_tokens_and_breakpoints() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "breakpoints": {
                "sm": "640px",
                "md": "768px"
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": {
                            "value": "#f00",
                            "description": "Red 500",
                            "deprecated": true
                        }
                    }
                },
                "spacing": {
                    "DEFAULT": {
                        "value": "1rem"
                    }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.red.500}",
                            "_dark": "#fff"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.red.500
      value: "#f00"
      var: var(--colors-red-500)
      category: colors
      condition: ~
      deprecated: true
      description: Red 500
    - path: spacing
      value: 1rem
      var: var(--spacing)
      category: spacing
      condition: ~
      deprecated: false
      description: ~
    - path: breakpoints.sm
      value: 640px
      var: var(--breakpoints-sm)
      category: breakpoints
      condition: ~
      deprecated: false
      description: ~
    - path: sizes.breakpoint-sm
      value: 640px
      var: var(--sizes-breakpoint-sm)
      category: sizes
      condition: ~
      deprecated: false
      description: ~
    - path: breakpoints.md
      value: 768px
      var: var(--breakpoints-md)
      category: breakpoints
      condition: ~
      deprecated: false
      description: ~
    - path: sizes.breakpoint-md
      value: 768px
      var: var(--sizes-breakpoint-md)
      category: sizes
      condition: ~
      deprecated: false
      description: ~
    - path: colors.fg
      value: var(--colors-red-500)
      var: var(--colors-fg)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.fg
      value: "#fff"
      var: var(--colors-fg)
      category: colors
      condition: _dark
      deprecated: false
      description: ~
    - path: colors.colorPalette
      value: var(--colors-color-palette)
      var: var(--colors-color-palette)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.colorPalette.500
      value: var(--colors-color-palette-500)
      var: var(--colors-color-palette-500)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
    assert_yaml_snapshot!(json!({
        "redDeprecated": dict.is_deprecated("colors.red.500"),
        "darkFg": dict
            .token_with_condition("colors.fg", "_dark")
            .map(|token| token.value.as_ref()),
    }), @r##"
    redDeprecated: true
    darkFg: "#fff"
    "##);
}

#[test]
fn from_config_collects_theme_variant_tokens_as_theme_conditions() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "bg": { "value": "#fff" }
                }
            }
        },
        "themes": {
            "dark": {
                "tokens": {
                    "colors": {
                        "bg": { "value": "#000" }
                    }
                },
                "semanticTokens": {
                    "colors": {
                        "fg": { "value": "{colors.bg}" }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.bg
      value: "#fff"
      var: var(--colors-bg)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.bg
      value: "#000"
      var: var(--colors-bg)
      category: colors
      condition: _themeDark
      deprecated: false
      description: ~
    - path: colors.fg
      value: var(--colors-bg)
      var: var(--colors-fg)
      category: colors
      condition: _themeDark
      deprecated: false
      description: ~
    - path: colors.colorPalette
      value: var(--colors-color-palette)
      var: var(--colors-color-palette)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
    let conditions: Vec<&str> = dict
        .conditions()
        .iter()
        .map(std::convert::AsRef::as_ref)
        .collect();
    assert_yaml_snapshot!(json!({ "conditions": conditions }), @r##"
    conditions:
      - _themeDark
    "##);
}

#[test]
fn from_config_transforms_composite_token_values() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": { "value": "#f00" }
                },
                "shadows": {
                    "sm": {
                        "value": {
                            "offsetX": 4,
                            "offsetY": 10,
                            "blur": 4,
                            "spread": 0,
                            "color": "{colors.red}"
                        }
                    },
                    "ring": {
                        "value": [
                            { "offsetX": 0, "offsetY": 1, "blur": 2, "spread": 0, "color": "rgb(0 0 0 / 0.1)" },
                            { "offsetX": 0, "offsetY": 0, "blur": 0, "spread": 1, "color": "{colors.red}" }
                        ]
                    }
                },
                "gradients": {
                    "brand": {
                        "value": {
                            "type": "linear",
                            "placement": "to right",
                            "stops": [
                                { "color": "{colors.red}", "position": 0 },
                                { "color": "blue", "position": 100 }
                            ]
                        }
                    }
                },
                "fonts": {
                    "body": { "value": ["Inter", "sans-serif"] }
                },
                "easings": {
                    "smooth": { "value": [0.4, 0, 0.2, 1] }
                },
                "borders": {
                    "base": {
                        "value": { "width": 1, "style": "solid", "color": "{colors.red}" }
                    }
                },
                "assets": {
                    "logo": { "value": { "type": "url", "value": "/logo.svg" } },
                    "mark": { "value": { "type": "svg", "value": "<svg viewBox=\"0 0 1 1\"><path fill=\"#000\"/></svg>" } }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    assets.logo: "url(\"/logo.svg\")"
    assets.mark: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 1 1'%3e%3cpath fill='black'/%3e%3c/svg%3e\")"
    borders.base: 1px solid var(--colors-red)
    colors.colorPalette: var(--colors-color-palette)
    colors.red: "#f00"
    easings.smooth: "cubic-bezier(0.4, 0, 0.2, 1)"
    fonts.body: "Inter, sans-serif"
    gradients.brand: "linear-gradient(to right, var(--colors-red) 0px, blue 100px)"
    shadows.ring: "0px 1px 2px 0px rgb(0 0 0 / 0.1), 0px 0px 0px 1px var(--colors-red)"
    shadows.sm: 4px 10px 4px 0px var(--colors-red)
    "##);
}

#[test]
fn from_config_expands_color_mix_references() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "pink": { "value": "#ff00ff" },
                    "border": { "value": "{colors.pink/30}" },
                    "ref": { "value": "{colors.border/40}" },
                    "overlay": { "value": "{colors.border/half}" }
                },
                "opacity": {
                    "half": { "value": 0.5 }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.pink/87}",
                            "_dark": "{colors.border}"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.border: "color-mix(in srgb, var(--colors-pink) 30%, transparent)"
    colors.colorPalette: var(--colors-color-palette)
    colors.fg: "color-mix(in srgb, var(--colors-pink) 87%, transparent)"
    colors.fg@_dark: var(--colors-border)
    colors.overlay: "color-mix(in srgb, var(--colors-border) 50%, transparent)"
    colors.pink: "#ff00ff"
    colors.ref: "color-mix(in srgb, var(--colors-border) 40%, transparent)"
    opacity.half: "0.5"
    "##);
}

#[test]
fn css_vars_view_groups_emittable_token_vars() {
    let mut negative = t(
        "spacing.-2",
        "calc(var(--spacing-2) * -1)",
        "",
        TokenCategory::Spacing,
    )
    .with_condition("_dark");
    negative.set_extension("isNegative", "true");
    let mut virtual_token = t(
        "colors.colorPalette",
        "colors.colorPalette",
        "var(--colors-color-palette)",
        TokenCategory::Colors,
    );
    virtual_token.set_extension("isVirtual", "true");

    let dict = TokenDictionary::builder()
        .insert(t(
            "colors.red",
            "#f00",
            "var(--colors-red)",
            TokenCategory::Colors,
        ))
        .insert(
            t(
                "colors.fg",
                "var(--colors-red)",
                "var(--colors-fg)",
                TokenCategory::Colors,
            )
            .with_condition("_dark"),
        )
        .insert(
            t(
                "colors.fg",
                "#000",
                "var(--colors-fg)",
                TokenCategory::Colors,
            )
            .with_condition("_themeDark"),
        )
        .insert(negative)
        .insert(virtual_token)
        .build();

    assert_yaml_snapshot!(snapshot_css_vars(&dict), @r##"
    base:
      - name: "--colors-red"
        value: "#f00"
    conditions:
      - condition: _dark
        vars:
          - name: "--colors-fg"
            value: var(--colors-red)
    "##);
}

#[test]
fn css_vars_view_does_not_skip_user_conditions_with_theme_prefix() {
    let dict = TokenDictionary::builder()
        .insert(
            t(
                "colors.fg",
                "#111",
                "var(--colors-fg)",
                TokenCategory::Colors,
            )
            .with_condition("_themeify"),
        )
        .build();

    assert_yaml_snapshot!(snapshot_css_vars(&dict), @r##"
    base: []
    conditions:
      - condition: _themeify
        vars:
          - name: "--colors-fg"
            value: "#111"
    "##);
}

#[test]
fn css_vars_view_uses_expanded_reference_and_color_mix_values() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "pink": { "value": "#ff00ff" },
                    "border": { "value": "{colors.pink/30}" }
                },
                "opacity": {
                    "half": { "value": 0.5 }
                }
            },
            "semanticTokens": {
                "colors": {
                    "fg": {
                        "value": {
                            "base": "{colors.pink}",
                            "_dark": "{colors.border/half}"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_css_vars(&dict), @r##"
    base:
      - name: "--opacity-half"
        value: "0.5"
      - name: "--colors-pink"
        value: "#ff00ff"
      - name: "--colors-border"
        value: "color-mix(in srgb, var(--colors-pink) 30%, transparent)"
      - name: "--colors-fg"
        value: var(--colors-pink)
    conditions:
      - condition: _dark
        vars:
          - name: "--colors-fg"
            value: "color-mix(in srgb, var(--colors-border) 50%, transparent)"
    "##);
}

#[test]
fn from_config_uses_css_var_prefix_and_hash_options() {
    let config: UserConfig = serde_json::from_value(json!({
        "prefix": {
            "cssVar": "panda"
        },
        "hash": {
            "cssVar": true
        },
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "500": {
                            "value": "#f00"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.red.500
      value: "#f00"
      var: var(--panda-iYfRb)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.colorPalette.500
      value: var(--panda-iOGEjQ)
      var: var(--panda-iOGEjQ)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
}

#[test]
fn virtual_color_palette_tokens_resolve_to_their_css_var() {
    // Parity with v1's `isVirtual -> varRef` rule: `token()` and `token.var()`
    // both yield the virtual var, never the dotted path string.
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "blue": {
                        "DEFAULT": { "value": "#00f" },
                        "500": { "value": "#3b82f6" }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    let resolutions = [
        (
            "get colors.colorPalette.500",
            dict.get("colors.colorPalette.500", None),
        ),
        (
            "get_var colors.colorPalette.500",
            dict.get_var("colors.colorPalette.500", None),
        ),
        (
            "get colors.colorPalette",
            dict.get("colors.colorPalette", None),
        ),
    ];
    assert_yaml_snapshot!(resolutions, @"
    - - get colors.colorPalette.500
      - var(--colors-color-palette-500)
    - - get_var colors.colorPalette.500
      - var(--colors-color-palette-500)
    - - get colors.colorPalette
      - var(--colors-color-palette)
    ");
}

#[test]
fn from_config_builds_color_palette_view() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "primary": { "value": "#111" },
                    "red": {
                        "300": { "value": "#fca5a5" },
                        "500": { "value": "#ef4444" }
                    },
                    "button": {
                        "light": {
                            "accent": {
                                "secondary": { "value": "#123456" }
                            }
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.button.light.accent.secondary: "#123456"
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.300: var(--colors-color-palette-300)
    colors.colorPalette.500: var(--colors-color-palette-500)
    colors.colorPalette.accent.secondary: var(--colors-color-palette-accent-secondary)
    colors.colorPalette.light.accent.secondary: var(--colors-color-palette-light-accent-secondary)
    colors.colorPalette.secondary: var(--colors-color-palette-secondary)
    colors.primary: "#111"
    colors.red.300: "#fca5a5"
    colors.red.500: "#ef4444"
    "##);
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    button:
      "--colors-color-palette-light-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light:
      "--colors-color-palette-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light.accent:
      "--colors-color-palette-secondary": var(--colors-button-light-accent-secondary)
    primary:
      "--colors-color-palette": var(--colors-primary)
    red:
      "--colors-color-palette-300": var(--colors-red-300)
      "--colors-color-palette-500": var(--colors-red-500)
    "##);
}

#[test]
fn from_config_color_palette_handles_default_keyword() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "brand": {
                        "DEFAULT": { "value": "green" },
                        "hot": {
                            "DEFAULT": { "value": "blue" },
                            "er": { "value": "#FF0000" }
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.brand: green
    colors.brand.hot: blue
    colors.brand.hot.er: "#FF0000"
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.er: var(--colors-color-palette-er)
    colors.colorPalette.hot: var(--colors-color-palette-hot)
    colors.colorPalette.hot.er: var(--colors-color-palette-hot-er)
    "##);
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    brand:
      "--colors-color-palette": var(--colors-brand)
      "--colors-color-palette-hot": var(--colors-brand-hot)
      "--colors-color-palette-hot-er": var(--colors-brand-hot-er)
    brand.hot:
      "--colors-color-palette": var(--colors-brand-hot)
      "--colors-color-palette-er": var(--colors-brand-hot-er)
    "##);
}

#[test]
fn from_config_color_palette_handles_nested_semantic_defaults() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "button": {
                        "dark": {
                            "value": "navy"
                        },
                        "light": {
                            "DEFAULT": {
                                "value": "skyblue"
                            },
                            "accent": {
                                "DEFAULT": {
                                    "value": "cyan"
                                },
                                "secondary": {
                                    "value": "blue"
                                }
                            }
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @"
    colors.button.dark: navy
    colors.button.light: skyblue
    colors.button.light.accent: cyan
    colors.button.light.accent.secondary: blue
    colors.colorPalette: var(--colors-color-palette)
    colors.colorPalette.accent: var(--colors-color-palette-accent)
    colors.colorPalette.accent.secondary: var(--colors-color-palette-accent-secondary)
    colors.colorPalette.dark: var(--colors-color-palette-dark)
    colors.colorPalette.light: var(--colors-color-palette-light)
    colors.colorPalette.light.accent: var(--colors-color-palette-light-accent)
    colors.colorPalette.light.accent.secondary: var(--colors-color-palette-light-accent-secondary)
    colors.colorPalette.secondary: var(--colors-color-palette-secondary)
    ");
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    button:
      "--colors-color-palette-dark": var(--colors-button-dark)
      "--colors-color-palette-light": var(--colors-button-light)
      "--colors-color-palette-light-accent": var(--colors-button-light-accent)
      "--colors-color-palette-light-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light:
      "--colors-color-palette": var(--colors-button-light)
      "--colors-color-palette-accent": var(--colors-button-light-accent)
      "--colors-color-palette-accent-secondary": var(--colors-button-light-accent-secondary)
    button.light.accent:
      "--colors-color-palette": var(--colors-button-light-accent)
      "--colors-color-palette-secondary": var(--colors-button-light-accent-secondary)
    "##);
}

#[test]
fn from_config_respects_color_palette_options() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "include": ["red*"]
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" },
                        "muted": { "value": "#fee2e2" }
                    },
                    "blue": {
                        "500": { "value": "#3b82f6" }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.blue.500: "#3b82f6"
    colors.colorPalette.500: var(--colors-color-palette-500)
    colors.colorPalette.muted: var(--colors-color-palette-muted)
    colors.red.500: "#ef4444"
    colors.red.muted: "#fee2e2"
    "##);
    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    red:
      "--colors-color-palette-500": var(--colors-red-500)
      "--colors-color-palette-muted": var(--colors-red-muted)
    "##);
}

#[test]
fn from_config_color_palette_include_exclude_match_js_cases() {
    let include_config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "include": ["red", "blue"]
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#red500" },
                        "700": { "value": "#red700" }
                    },
                    "blue": {
                        "500": { "value": "#blue500" },
                        "700": { "value": "#blue700" }
                    },
                    "green": {
                        "500": { "value": "#green500" },
                        "700": { "value": "#green700" }
                    }
                }
            }
        }
    }))
    .expect("config");
    let include_dict = TokenDictionary::from_config(&include_config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_color_palettes(&include_dict), @r##"
    blue:
      "--colors-color-palette-500": var(--colors-blue-500)
      "--colors-color-palette-700": var(--colors-blue-700)
    red:
      "--colors-color-palette-500": var(--colors-red-500)
      "--colors-color-palette-700": var(--colors-red-700)
    "##);

    let exclude_config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "exclude": ["red"]
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#red500" },
                        "700": { "value": "#red700" }
                    },
                    "blue": {
                        "500": { "value": "#blue500" },
                        "700": { "value": "#blue700" }
                    },
                    "green": {
                        "500": { "value": "#green500" },
                        "700": { "value": "#green700" }
                    }
                }
            }
        }
    }))
    .expect("config");
    let exclude_dict = TokenDictionary::from_config(&exclude_config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_color_palettes(&exclude_dict), @r##"
    blue:
      "--colors-color-palette-500": var(--colors-blue-500)
      "--colors-color-palette-700": var(--colors-blue-700)
    green:
      "--colors-color-palette-500": var(--colors-green-500)
      "--colors-color-palette-700": var(--colors-green-700)
    "##);
}

#[test]
fn from_config_color_palette_include_supports_semantic_tokens() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "include": ["primary"]
            },
            "tokens": {
                "colors": {
                    "blue": { "500": { "value": "#blue500" } },
                    "red": { "500": { "value": "#red500" } },
                    "green": { "500": { "value": "#green500" } }
                }
            },
            "semanticTokens": {
                "colors": {
                    "primary": { "value": "{colors.blue.500}" },
                    "secondary": { "value": "{colors.red.500}" },
                    "accent": { "value": "{colors.green.500}" }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_color_palettes(&dict), @r##"
    primary:
      "--colors-color-palette": var(--colors-primary)
    "##);
}

#[test]
fn from_config_can_disable_color_palette_generation() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "colorPalette": {
                "enabled": false
            },
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(json!({ "values": snapshot_token_values(&dict) }), @r##"
    values:
      colors.red.500: "#ef4444"
    "##);
    assert!(dict.color_palettes().is_empty());
}

#[test]
fn from_config_resolves_alias_chains_like_js_dictionary() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "pink": { "value": "#ff00ff" },
                    "border": { "value": "{colors.pink}" },
                    "disabled": { "value": "{colors.border}" }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_values(&dict), @r##"
    colors.border: var(--colors-pink)
    colors.colorPalette: var(--colors-color-palette)
    colors.disabled: var(--colors-border)
    colors.pink: "#ff00ff"
    "##);
}

#[test]
fn from_config_flattens_deep_semantic_conditions_like_js() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "pink": {
                        "value": {
                            "base": "#fff",
                            "osDark": {
                                "highCon": "sdfdfsd"
                            }
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_tokens(&dict), @r##"
    - path: colors.pink
      value: "#fff"
      var: var(--colors-pink)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    - path: colors.pink
      value: sdfdfsd
      var: var(--colors-pink)
      category: colors
      condition: "osDark:highCon"
      deprecated: false
      description: ~
    - path: colors.colorPalette
      value: var(--colors-color-palette)
      var: var(--colors-color-palette)
      category: colors
      condition: ~
      deprecated: false
      description: ~
    "##);
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "fixture-heavy middleware test keeps related spacing assertions together"
)]
fn from_config_applies_spacing_middlewares() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "spacing": {
                    "0": { "value": "0rem" },
                    "sm": { "value": "0.25rem" },
                    "empty": { "value": "" }
                },
                "sizes": {
                    "full": { "value": "100%" }
                }
            },
            "semanticTokens": {
                "spacing": {
                    "gutter": {
                        "value": {
                            "base": "{spacing.sm}",
                            "_wide": "2rem"
                        }
                    }
                }
            }
        }
    }))
    .expect("config");

    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");

    assert_yaml_snapshot!(snapshot_token_details(&dict), @r#"
    - path: sizes.full
      value: 100%
      var: var(--sizes-full)
      category: sizes
      condition: ~
      originalValue: ~
      extensions: {}
    - path: spacing.0
      value: 0rem
      var: var(--spacing-0)
      category: spacing
      condition: ~
      originalValue: ~
      extensions: {}
    - path: spacing.sm
      value: 0.25rem
      var: var(--spacing-sm)
      category: spacing
      condition: ~
      originalValue: ~
      extensions: {}
    - path: spacing.gutter
      value: var(--spacing-sm)
      var: var(--spacing-gutter)
      category: spacing
      condition: ~
      originalValue: "{spacing.sm}"
      extensions: {}
    - path: spacing.gutter
      value: 2rem
      var: var(--spacing-gutter)
      category: spacing
      condition: _wide
      originalValue: ~
      extensions: {}
    - path: spacing.-sm
      value: calc(var(--spacing-sm) * -1)
      var: ""
      category: spacing
      condition: ~
      originalValue: 0.25rem
      extensions:
        isNegative: "true"
        originalPath: spacing.sm
        prop: "-sm"
    - path: spacing.-empty
      value: calc(var(--spacing-empty) * -1)
      var: ""
      category: spacing
      condition: ~
      originalValue: ""
      extensions:
        isNegative: "true"
        originalPath: spacing.empty
        prop: "-empty"
    - path: spacing.-gutter
      value: calc(var(--spacing-gutter) * -1)
      var: ""
      category: spacing
      condition: ~
      originalValue: "{spacing.sm}"
      extensions:
        isNegative: "true"
        originalPath: spacing.gutter
        prop: "-gutter"
    - path: spacing.-gutter
      value: calc(var(--spacing-gutter) * -1)
      var: ""
      category: spacing
      condition: _wide
      originalValue: 2rem
      extensions:
        isNegative: "true"
        originalPath: spacing.gutter
        prop: "-gutter"
    "#);
}

fn snapshot_tokens(dict: &TokenDictionary) -> Vec<serde_json::Value> {
    dict.iter()
        .map(|token| {
            json!({
                "path": token.path.as_ref(),
                "value": token.value.as_ref(),
                "var": token.var.as_ref(),
                "category": token.category.as_str(),
                "condition": token.condition.as_deref(),
                "deprecated": token.deprecated,
                "description": token.description.as_deref(),
            })
        })
        .collect()
}

fn snapshot_token_details(dict: &TokenDictionary) -> Vec<serde_json::Value> {
    dict.iter()
        .map(|token| {
            json!({
                "path": token.path.as_ref(),
                "value": token.value.as_ref(),
                "var": token.var.as_ref(),
                "category": token.category.as_str(),
                "condition": token.condition.as_deref(),
                "originalValue": token.original_value.as_deref(),
                "extensions": token
                    .extension_entries()
                    .collect::<std::collections::BTreeMap<_, _>>(),
            })
        })
        .collect()
}

fn snapshot_token_values(
    dict: &TokenDictionary,
) -> std::collections::BTreeMap<String, serde_json::Value> {
    dict.iter()
        .map(|token| {
            let key = if let Some(condition) = token.condition.as_deref() {
                format!("{}@{condition}", token.path)
            } else {
                token.path.to_string()
            };
            (key, json!(token.value.as_ref()))
        })
        .collect()
}

fn snapshot_token_vars(dict: &TokenDictionary) -> std::collections::BTreeMap<String, String> {
    dict.iter()
        .map(|token| (token.path.to_string(), token.var.to_string()))
        .collect()
}

fn snapshot_category_values(
    dict: &TokenDictionary,
    category: &TokenCategory,
) -> std::collections::BTreeMap<String, String> {
    dict.category_values(category).into_iter().collect()
}

fn snapshot_color_palettes(
    dict: &TokenDictionary,
) -> std::collections::BTreeMap<String, std::collections::BTreeMap<String, String>> {
    dict.color_palettes()
        .palettes()
        .iter()
        .map(|(palette, values)| {
            (
                palette.to_string(),
                values
                    .iter()
                    .map(|(key, value)| (key.to_string(), value.to_string()))
                    .collect(),
            )
        })
        .collect()
}

fn snapshot_css_vars(dict: &TokenDictionary) -> serde_json::Value {
    let vars = dict.css_vars();
    json!({
        "base": vars
            .base
            .iter()
            .map(|var| json!({ "name": var.name, "value": var.value }))
            .collect::<Vec<_>>(),
        "conditions": vars
            .conditions
            .iter()
            .map(|group| {
                json!({
                    "condition": group.condition,
                    "vars": group
                        .vars
                        .iter()
                        .map(|var| json!({ "name": var.name, "value": var.value }))
                        .collect::<Vec<_>>(),
                })
            })
            .collect::<Vec<_>>(),
    })
}

// --- runtime `toVar` parity ---
//
// The generated `tokens/index` runtime derives every var-ref from the path via
// a `toVar` helper instead of storing it. This mirrors that helper in Rust and
// asserts it reproduces the dictionary's real `token.var` for tricky names
// (uppercase, escape-needing `/`) across prefix + hash settings. If the runtime
// JS drifts from `css_var_variable`/`push_css_var_name`, this fails.

fn mirror_sanitize(out: &mut String, value: &str) {
    for ch in value.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else if ch.is_ascii_alphanumeric()
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
}

fn mirror_to_var(path: &str, prefix: &str, hash: bool) -> String {
    let name = path.replace('.', "-");
    let body = if hash {
        pandacss_shared::to_hash(&name)
    } else {
        let mut sanitized = String::new();
        mirror_sanitize(&mut sanitized, &name);
        sanitized
    };

    let mut out = String::from("var(--");
    if !prefix.is_empty() {
        if hash {
            out.push_str(prefix);
        } else {
            mirror_sanitize(&mut out, prefix);
        }
        out.push('-');
    }
    out.push_str(&body);
    out.push(')');
    out
}

#[test]
fn runtime_to_var_reproduces_every_token_var() {
    for (prefix, hash) in [("", false), ("pd", false), ("panda", true)] {
        let config: UserConfig = serde_json::from_value(json!({
            "prefix": { "cssVar": prefix },
            "hash": { "cssVar": hash },
            "theme": {
                "tokens": {
                    "colors": {
                        "red": { "500": { "value": "#f00" } },
                        "brandPrimary": { "value": "#111" }
                    },
                    "sizes": { "1/2": { "value": "50%" } }
                }
            }
        }))
        .expect("config");

        let dict = TokenDictionary::from_config(&config)
            .expect("token dictionary")
            .expect("non-empty dictionary");

        for token in dict.iter() {
            assert_eq!(
                mirror_to_var(&token.path, prefix, hash),
                token.var.as_ref(),
                "path={} prefix={prefix:?} hash={hash}",
                token.path,
            );
        }
    }
}
