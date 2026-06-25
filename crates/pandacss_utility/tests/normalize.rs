use pandacss_extractor::Literal;
use pandacss_utility::{StyleNormalizer, Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

#[test]
fn internal_policy_resolves_shorthands_when_user_flag_is_off() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "marginInline": { "shorthand": "mx" },
            "paddingInline": { "shorthand": ["px", "paddingX"] }
        })),
        UtilityOptions {
            shorthands: false,
            ..UtilityOptions::default()
        },
    );

    let style = Literal::Object(vec![
        ("mx".into(), Literal::String("auto".into())),
        ("px".into(), Literal::String("4".into())),
    ]);

    let normalized = StyleNormalizer::internal(Some(&utility), &[]).normalize(&style);
    let Literal::Object(entries) = normalized.as_ref() else {
        panic!("expected object");
    };

    assert!(entries.iter().any(|(key, _)| key == "marginInline"));
    assert!(entries.iter().any(|(key, _)| key == "paddingInline"));
    assert!(!entries.iter().any(|(key, _)| key == "mx" || key == "px"));
}

#[test]
fn user_facing_policy_keeps_shorthands_when_user_flag_is_off() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "marginInline": { "shorthand": "mx" }
        })),
        UtilityOptions {
            shorthands: false,
            ..UtilityOptions::default()
        },
    );

    let style = Literal::Object(vec![("mx".into(), Literal::String("auto".into()))]);
    let normalized = StyleNormalizer::user_facing(Some(&utility), &[]).normalize(&style);
    let Literal::Object(entries) = normalized.as_ref() else {
        panic!("expected object");
    };

    assert_eq!(entries, &[("mx".into(), Literal::String("auto".into()))]);
}

#[test]
fn user_facing_policy_resolves_when_user_flag_is_on() {
    let utility = Utility::from_config(&utility_config(json!({
        "marginInline": { "shorthand": "mx" }
    })));

    let style = Literal::Object(vec![("mx".into(), Literal::String("auto".into()))]);
    let normalized = StyleNormalizer::user_facing(Some(&utility), &[]).normalize(&style);
    let Literal::Object(entries) = normalized.as_ref() else {
        panic!("expected object");
    };

    assert_eq!(
        entries,
        &[("marginInline".into(), Literal::String("auto".into()))]
    );
}

#[test]
fn fused_resolve_key_matches_standalone_normalize() {
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "marginInline": { "shorthand": "mx" }
        })),
        UtilityOptions {
            shorthands: false,
            ..UtilityOptions::default()
        },
    );

    let style = Literal::Object(vec![("mx".into(), Literal::String("auto".into()))]);
    let normalizer = StyleNormalizer::internal(Some(&utility), &[]);
    let resolved = normalizer.normalize(&style);
    let Literal::Object(entries) = resolved.as_ref() else {
        panic!("expected object");
    };

    assert_eq!(
        pandacss_encoder::NormalizeAtomic::resolve_key(&normalizer, "mx"),
        "marginInline"
    );
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].0, "marginInline");
}
