//! Core dictionary access: `get`, `get_var`, fallbacks, flat path-to-var maps,
//! reverse var lookup, conditional vs unconditional resolution, iteration,
//! deprecation flags, metadata round-trips, serde, builder `push`, borrow
//! behavior, and color-mix / opacity-modifier resolution.

use crate::common::{snapshot_token_values, snapshot_tokens, t};
use insta::assert_yaml_snapshot;
use pandacss_config::UserConfig;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use serde_json::json;

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
    token_percent: "color-mix(in oklab, var(--colors-red-300) 40%, transparent)"
    token_opacity: "color-mix(in oklab, var(--colors-red-300) 50%, transparent)"
    raw_color: "color-mix(in oklab, red 30%, transparent)"
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

fn snapshot_token_vars(dict: &TokenDictionary) -> std::collections::BTreeMap<String, String> {
    dict.iter()
        .map(|token| (token.path.to_string(), token.var.to_string()))
        .collect()
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
