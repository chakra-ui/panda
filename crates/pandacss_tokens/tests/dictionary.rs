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
//! Build-time pipeline (transforms, middleware, semantic-token expansion,
//! color-palette resolution) lives on the JS side for now — the lookup
//! API is what the extractor needs and what this crate guarantees.

use pandacss_tokens::{Token, TokenCategory, TokenDictionary};

fn t(path: &str, value: &str, var: &str, category: TokenCategory) -> Token {
    Token::new(path, value, var, category)
}

// --- core lookup ---

#[test]
fn empty_dictionary_is_inert() {
    let dict = TokenDictionary::new();
    assert!(dict.is_empty());
    assert_eq!(dict.len(), 0);
    assert_eq!(dict.get("colors.red.500", None), None);
    assert_eq!(
        dict.get("colors.red.500", Some("#000")),
        Some("#000".into())
    );
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

    assert_eq!(dict.get("colors.red.500", None), Some("#ef4444".into()));
    assert_eq!(
        dict.get_var("colors.red.500", None),
        Some("var(--colors-red-500)".into()),
    );
}

#[test]
fn fallback_used_when_path_missing() {
    let dict = TokenDictionary::new();
    assert_eq!(
        dict.get("colors.red.500", Some("#000")),
        Some("#000".into())
    );
    assert_eq!(
        dict.get_var("colors.red.500", Some("var(--fallback)")),
        Some("var(--fallback)".into()),
    );
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

    let expected = [
        ("colors.red", "var(--colors-red)"),
        ("colors.blue", "var(--colors-blue)"),
        ("colors.green", "var(--colors-green)"),
        ("colors.pink.50", "var(--colors-pink-50)"),
        ("colors.pink.100", "var(--colors-pink-100)"),
    ];
    for (path, var) in expected {
        assert_eq!(
            dict.get_var(path, None).as_deref(),
            Some(var),
            "path={path}"
        );
    }
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

    let colors = dict.category_values(&TokenCategory::Colors);
    assert_eq!(colors.len(), 2);
    assert_eq!(colors.get("colors.red"), Some(&"#f00".to_string()));
    assert_eq!(colors.get("colors.blue"), Some(&"#00f".to_string()));

    let sizes = dict.category_values(&TokenCategory::Sizes);
    assert_eq!(sizes.len(), 2);
    assert_eq!(sizes.get("sizes.sm"), Some(&"4px".to_string()));
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
    assert_eq!(token.path, "colors.red.500");
    assert_eq!(token.value, "#ef4444");
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
    assert_eq!(dict.get("colors.bg", None), Some("#fff".into()));
    // The dark variant is still reachable through the conditional lookup.
    let dark = dict
        .token_with_condition("colors.bg", "_dark")
        .expect("conditional present");
    assert_eq!(dark.value, "#000");
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
    assert_eq!(token.condition.as_deref(), Some("_dark"));
    assert_eq!(dict.get("colors.accent", None), Some("tomato".into()));
}

#[test]
fn distinct_conditions_are_enumerated() {
    let dict = TokenDictionary::builder()
        .insert(t("colors.bg", "#fff", "v", TokenCategory::Colors))
        .insert(t("colors.bg", "#000", "v", TokenCategory::Colors).with_condition("_dark"))
        .insert(t("colors.fg", "#000", "v", TokenCategory::Colors).with_condition("_dark"))
        .insert(t("colors.fg", "#999", "v", TokenCategory::Colors).with_condition("_hover"))
        .build();

    let conds = dict.conditions();
    assert_eq!(conds, vec!["_dark", "_hover"]);
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
        .map(|t| t.path.as_str())
        .collect();
    assert_eq!(dark_paths, vec!["colors.bg", "colors.fg"]);
}

// --- iteration ---

#[test]
fn iter_preserves_insertion_order() {
    let dict = TokenDictionary::builder()
        .insert(t("a", "1", "v1", TokenCategory::Other("x".into())))
        .insert(t("b", "2", "v2", TokenCategory::Other("x".into())))
        .insert(t("c", "3", "v3", TokenCategory::Other("x".into())))
        .build();
    let paths: Vec<&str> = dict.iter().map(|t| t.path.as_str()).collect();
    assert_eq!(paths, vec!["a", "b", "c"]);
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
        .map(|t| t.path.as_str())
        .collect();
    assert_eq!(color_paths, vec!["colors.red.500", "colors.blue.500"]);
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
    assert_eq!(dict.deprecated_paths(), vec!["colors.red"]);
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
    assert_eq!(got.description.as_deref(), Some("Primary brand color"));
    assert_eq!(got.extension("theme"), Some("light"));
    assert_eq!(got.extension("missing"), None);
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

    // Indexed lookups work on the restored dictionary.
    assert_eq!(restored.get("colors.red.500", None), Some("#ef4444".into()));
    assert_eq!(
        restored.get_var("sizes.sm", None),
        Some("var(--sizes-sm)".into()),
    );
    // Reverse var lookup works (would be empty if indexes weren't rebuilt).
    assert!(restored.token_by_var("var(--colors-red-500)").is_some());
    // Category iteration works.
    assert_eq!(restored.iter_category(&TokenCategory::Colors).count(), 1);
    assert_eq!(restored.len(), original.len());
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
    assert_eq!(dict.len(), 2);
    assert_eq!(dict.get("colors.red", None).as_deref(), Some("#f00"));
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
    assert_eq!(v, Some("#ef4444"));
    let var: Option<&str> = dict.get_var_str("colors.red.500", None);
    assert_eq!(var, Some("var(--colors-red-500)"));
    // Fallback path returns the supplied borrow verbatim.
    let fallback: Option<&str> = dict.get_str("colors.missing", Some("#000"));
    assert_eq!(fallback, Some("#000"));
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

    assert_eq!(dict.get("colors.red.500", None), Some("#ef4444".into()));
    assert_eq!(dict.get_var("sizes.sm", None), Some("var(--sz-sm)".into()));
    assert_eq!(
        dict.token("colors.red.500").map(|t| &t.category),
        Some(&TokenCategory::Colors),
    );
}
