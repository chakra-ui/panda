use pandacss_config::UserConfig;
use pandacss_stylesheet::{StyleReference, StyleReferences};
use pandacss_system::System;
use serde_json::json;

use crate::common::config;

fn theme() -> UserConfig {
    config(json!({
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "animation": { "className": "anim", "values": "animations" },
            "animationName": { "className": "anim-n" },
            "marginTop": { "className": "mt", "shorthand": "mt", "values": "spacing" }
        },
        "theme": {
            "tokens": {
                "colors": { "red": { "500": { "value": "#e00" } }, "night": { "value": "#111" } },
                "spacing": { "4": { "value": "1rem" } },
                "animations": { "spin": { "value": "spin 1s linear infinite" } }
            },
            "semanticTokens": {
                "colors": {
                    "danger": { "value": "{colors.red.500}" },
                    "onlyDark": { "value": { "_dark": "{colors.night}" } }
                }
            },
            "keyframes": {
                "spin": { "to": { "color": "{colors.danger}" } },
                "fade": { "to": { "opacity": 0 } }
            },
            "textStyles": { "body": { "value": { "color": "danger" } } }
        },
        "conditions": { "dark": "&.dark" }
    }))
}

fn references_for(config: &UserConfig, check: impl FnOnce(&StyleReferences<'_>)) {
    let system = System::new(config.clone()).expect("valid config");
    let dictionary = system.token_dictionary();
    let utility = system.value_utility().expect("utility");
    check(&StyleReferences::new(
        config,
        utility,
        dictionary.as_deref(),
    ));
}

fn token(path: &str) -> StyleReference {
    StyleReference::Token(path.to_owned())
}

#[test]
fn a_semantic_token_written_in_a_style_is_the_reference_not_its_alias() {
    references_for(&theme(), |references| {
        let found = references.property("color", &json!("danger"));
        assert!(found.contains(&token("colors.danger")));
        assert!(!found.contains(&token("colors.red.500")));
        assert_eq!(
            references.dependencies(&token("colors.danger")),
            [token("colors.red.500")]
        );
    });
}

#[test]
fn an_animation_token_reaches_its_keyframes_only_through_the_token() {
    references_for(&theme(), |references| {
        let found = references.property("animation", &json!("spin"));
        assert!(found.contains(&token("animations.spin")));
        assert!(!found.contains(&StyleReference::Keyframe("spin".to_owned())));
        assert_eq!(
            references.dependencies(&token("animations.spin")),
            [StyleReference::Keyframe("spin".to_owned())]
        );
    });
}

#[test]
fn a_keyframe_written_by_name_and_the_tokens_its_steps_use() {
    references_for(&theme(), |references| {
        let found = references.property("animationName", &json!("fade"));
        assert!(found.contains(&StyleReference::Keyframe("fade".to_owned())));
        assert_eq!(
            references.dependencies(&StyleReference::Keyframe("spin".to_owned())),
            [
                StyleReference::Utility("color".to_owned()),
                token("colors.danger")
            ]
        );
    });
}

#[test]
fn a_text_style_stays_one_reference_and_its_styles_are_its_dependencies() {
    references_for(&theme(), |references| {
        let body = StyleReference::Composition("textStyles.body".to_owned());
        assert_eq!(
            references.property("textStyle", &json!("body")),
            [
                StyleReference::Utility("textStyle".to_owned()),
                body.clone()
            ]
        );
        let dependencies = references.dependencies(&body);
        assert!(dependencies.contains(&token("colors.danger")));
        assert!(dependencies.contains(&StyleReference::Utility("color".to_owned())));
    });
}

#[test]
fn a_negative_shorthand_value_references_the_positive_token() {
    references_for(&theme(), |references| {
        let found = references.property("mt", &json!("-4"));
        assert!(found.contains(&token("spacing.4")));
        assert!(found.contains(&StyleReference::Utility("marginTop".to_owned())));
    });
}

#[test]
fn a_token_defined_only_under_a_condition_still_has_dependencies() {
    references_for(&theme(), |references| {
        assert_eq!(
            references.dependencies(&token("colors.onlyDark")),
            [token("colors.night")]
        );
    });
}

#[test]
fn nested_conditions_and_selectors_are_walked() {
    references_for(&theme(), |references| {
        let found = references.style_object(&json!({
            "_dark": { "color": "red.500" },
            "& > span": { "animationName": "fade" }
        }));
        assert!(found.contains(&token("colors.red.500")));
        assert!(found.contains(&StyleReference::Keyframe("fade".to_owned())));
    });
}
