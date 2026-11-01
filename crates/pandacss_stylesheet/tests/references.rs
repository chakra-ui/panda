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

#[test]
fn global_css_element_selectors_are_not_read_as_shorthand_properties() {
    let config = config(json!({
        "utilities": {
            "padding": { "className": "p", "shorthand": "p", "values": "spacing" },
            "margin": { "className": "m", "values": "spacing" }
        },
        "theme": { "tokens": { "spacing": { "4": { "value": "1rem" } } } },
        "globalCss": { "p": { "margin": "4" } }
    }));
    references_for(&config, |references| {
        assert_eq!(
            references.global_css(&config.global_css),
            [
                StyleReference::Utility("margin".to_owned()),
                token("spacing.4")
            ]
        );
    });
}

#[test]
fn global_css_selectors_under_a_condition_are_read_as_selectors() {
    let config = config(json!({
        "conditions": { "dark": "&.dark" },
        "utilities": {
            "padding": { "className": "p", "shorthand": "p", "values": "spacing" },
            "margin": { "className": "m", "values": "spacing" }
        },
        "theme": { "tokens": { "spacing": { "4": { "value": "1rem" } } } },
        "globalCss": {
            "_dark": { "p": { "margin": "4" } },
            "@media (min-width: 40em)": { "p": { "margin": "4" } }
        }
    }));
    references_for(&config, |references| {
        assert_eq!(
            references.global_css(&config.global_css),
            [
                StyleReference::Utility("margin".to_owned()),
                token("spacing.4")
            ]
        );
    });
}

#[test]
fn every_responsive_composition_value_is_a_reference() {
    let config = config(json!({
        "conditions": { "dark": "&.dark" },
        "theme": { "textStyles": {
            "lead": { "value": { "fontSize": "20px" } },
            "xl": { "value": { "fontSize": "32px" } }
        } },
        "globalCss": { "body": { "textStyle": { "base": "lead", "_dark": "xl" } } }
    }));
    references_for(&config, |references| {
        let found = references.global_css(&config.global_css);
        assert!(found.contains(&StyleReference::Composition("textStyles.lead".to_owned())));
        assert!(found.contains(&StyleReference::Composition("textStyles.xl".to_owned())));
    });
}

#[test]
fn a_hyphenated_css_property_key_resolves_to_its_utility() {
    let config = config(json!({
        "utilities": { "marginTop": { "className": "mt", "values": "spacing" } },
        "theme": { "tokens": { "spacing": { "4": { "value": "1rem" } } } },
        "globalCss": { "body": { "margin-top": "4" } }
    }));
    references_for(&config, |references| {
        assert!(
            references
                .global_css(&config.global_css)
                .contains(&StyleReference::Utility("marginTop".to_owned()))
        );
    });
}

#[test]
fn a_composition_depends_on_what_its_conditional_styles_use() {
    let config = config(json!({
        "conditions": { "dark": "&.dark" },
        "utilities": { "color": { "className": "c", "values": "colors" } },
        "theme": {
            "tokens": { "colors": { "night": { "value": "#111" } } },
            "textStyles": { "lead": { "value": { "_dark": { "color": "night" } } } }
        }
    }));
    references_for(&config, |references| {
        let found =
            references.dependencies(&StyleReference::Composition("textStyles.lead".to_owned()));
        assert!(found.contains(&token("colors.night")), "{found:?}");
    });
}

fn aliased_theme(tokens: &serde_json::Value) -> UserConfig {
    config(json!({
        "conditions": { "hover": "&:hover" },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "borderColor": { "className": "bc", "values": "colors" }
        },
        "theme": {
            "tokens": { "colors": { "semantic": { "text": tokens } } },
            "semanticTokens": {
                "colors": { "fg": { "value": "{colors.semantic.text.neutral.main}" } }
            }
        }
    }))
}

fn canonical_first() -> UserConfig {
    aliased_theme(&json!({
        "neutral": { "main": { "value": "#111" } },
        "neutralMain": { "value": "#111", "deprecated": true }
    }))
}

fn deprecated_first() -> UserConfig {
    aliased_theme(&json!({
        "neutralMain": { "value": "#111", "deprecated": true },
        "neutral": { "main": { "value": "#111" } }
    }))
}

#[test]
fn a_token_is_reported_by_its_written_path_when_a_later_alias_shares_its_variable() {
    references_for(&canonical_first(), |references| {
        assert_eq!(
            references.property("color", &json!("semantic.text.neutral.main")),
            [
                StyleReference::Utility("color".to_owned()),
                token("colors.semantic.text.neutral.main")
            ]
        );
    });
}

#[test]
fn a_deprecated_alias_is_reported_by_its_written_path_when_declared_first() {
    references_for(&deprecated_first(), |references| {
        assert_eq!(
            references.property("color", &json!("semantic.text.neutralMain")),
            [
                StyleReference::Utility("color".to_owned()),
                token("colors.semantic.text.neutralMain")
            ]
        );
    });
}

#[test]
fn a_canonical_token_is_reported_by_its_written_path_when_the_alias_is_declared_first() {
    references_for(&deprecated_first(), |references| {
        assert_eq!(
            references.property("color", &json!("semantic.text.neutral.main")),
            [
                StyleReference::Utility("color".to_owned()),
                token("colors.semantic.text.neutral.main")
            ]
        );
    });
}

#[test]
fn a_braced_token_reference_keeps_its_written_path_when_an_alias_shares_its_variable() {
    references_for(&canonical_first(), |references| {
        let found = references.property(
            "border",
            &json!("1px solid {colors.semantic.text.neutral.main}"),
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
        assert!(
            !found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
    });
}

#[test]
fn a_semantic_token_depends_on_the_path_it_was_defined_with_when_an_alias_shares_its_variable() {
    references_for(&canonical_first(), |references| {
        assert_eq!(
            references.dependencies(&token("colors.fg")),
            [token("colors.semantic.text.neutral.main")]
        );
    });
}

#[test]
fn both_aliases_written_in_one_value_are_both_reported() {
    references_for(&canonical_first(), |references| {
        let found = references.property(
            "background",
            &json!("linear-gradient({colors.semantic.text.neutralMain}, {colors.semantic.text.neutral.main})"),
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
    });
}

#[test]
fn both_aliases_written_in_one_value_in_reverse_order_are_both_reported() {
    references_for(&canonical_first(), |references| {
        let found = references.property(
            "background",
            &json!("linear-gradient({colors.semantic.text.neutral.main}, {colors.semantic.text.neutralMain})"),
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
    });
}

#[test]
fn both_aliases_written_under_conditions_of_one_property_are_both_reported() {
    references_for(&canonical_first(), |references| {
        let found = references.property(
            "color",
            &json!({ "base": "semantic.text.neutralMain", "_hover": "semantic.text.neutral.main" }),
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
    });
}

#[test]
fn both_aliases_written_under_conditions_of_one_property_in_reverse_order_are_both_reported() {
    references_for(&canonical_first(), |references| {
        let found = references.property(
            "color",
            &json!({ "base": "semantic.text.neutral.main", "_hover": "semantic.text.neutralMain" }),
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
    });
}

fn conditional_alias_theme(base: &str, dark: &str) -> UserConfig {
    config(json!({
        "conditions": { "dark": "&.dark" },
        "utilities": { "color": { "className": "c", "values": "colors" } },
        "theme": {
            "tokens": { "colors": { "semantic": { "text": {
                "neutral": { "main": { "value": "#111" } },
                "neutralMain": { "value": "#111", "deprecated": true }
            } } } },
            "semanticTokens": {
                "colors": { "fg": { "value": { "base": base, "_dark": dark } } }
            }
        }
    }))
}

#[test]
fn a_conditional_semantic_token_depends_on_both_aliases_it_names() {
    let config = conditional_alias_theme(
        "{colors.semantic.text.neutralMain}",
        "{colors.semantic.text.neutral.main}",
    );
    references_for(&config, |references| {
        let found = references.dependencies(&token("colors.fg"));
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
    });
}

#[test]
fn a_conditional_semantic_token_depends_on_both_aliases_it_names_in_reverse_order() {
    let config = conditional_alias_theme(
        "{colors.semantic.text.neutral.main}",
        "{colors.semantic.text.neutralMain}",
    );
    references_for(&config, |references| {
        let found = references.dependencies(&token("colors.fg"));
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
    });
}

fn composition_theme(lead: &serde_json::Value) -> UserConfig {
    config(json!({
        "conditions": { "hover": "&:hover" },
        "utilities": { "color": { "className": "c", "shorthand": "c", "values": "colors" } },
        "theme": {
            "tokens": { "colors": { "semantic": { "text": {
                "neutral": { "main": { "value": "#111" } },
                "neutralMain": { "value": "#111", "deprecated": true }
            } } } },
            "textStyles": { "lead": { "value": lead } }
        }
    }))
}

#[test]
fn a_composition_does_not_depend_on_an_alias_its_shorthand_overrides() {
    let config = composition_theme(&json!({
        "color": "semantic.text.neutralMain",
        "c": "semantic.text.neutral.main"
    }));
    references_for(&config, |references| {
        let found =
            references.dependencies(&StyleReference::Composition("textStyles.lead".to_owned()));
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
        assert!(
            !found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
    });
}

#[test]
fn a_composition_does_not_depend_on_an_alias_its_longhand_overrides() {
    let config = composition_theme(&json!({
        "c": "semantic.text.neutralMain",
        "color": "semantic.text.neutral.main"
    }));
    references_for(&config, |references| {
        let found =
            references.dependencies(&StyleReference::Composition("textStyles.lead".to_owned()));
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
        assert!(
            !found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
    });
}

#[test]
fn a_composition_depends_on_both_aliases_when_conditions_keep_both() {
    let config = composition_theme(&json!({
        "color": "semantic.text.neutralMain",
        "_hover": { "c": "semantic.text.neutral.main" }
    }));
    references_for(&config, |references| {
        let found =
            references.dependencies(&StyleReference::Composition("textStyles.lead".to_owned()));
        assert!(
            found.contains(&token("colors.semantic.text.neutral.main")),
            "{found:?}"
        );
        assert!(
            found.contains(&token("colors.semantic.text.neutralMain")),
            "{found:?}"
        );
    });
}

fn recipe_token_requirements(base: &serde_json::Value) -> String {
    let config = config(json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "utilities": { "color": { "className": "c", "shorthand": "c", "values": "colors" } },
        "theme": {
            "tokens": { "colors": { "semantic": { "text": {
                "neutral": { "main": { "value": "#111" } },
                "neutralMain": { "value": "#111", "deprecated": true }
            } } } },
            "recipes": { "label": { "className": "label", "base": base } }
        }
    }));
    let mut project = crate::common::project_with_source(
        &config,
        "import { label } from '@panda/recipes'; label();",
    );
    let snapshots = project.stylesheet_snapshots(&config);
    pandacss_stylesheet::collect_style_requirements(&crate::common::project_input(
        &config, &snapshots,
    ))
    .requirements
    .iter()
    .filter(|requirement| requirement.kind == "token")
    .map(|requirement| requirement.name.clone())
    .collect::<Vec<_>>()
    .join("\n")
}

#[test]
fn a_recipe_does_not_require_an_alias_its_shorthand_overrides() {
    let tokens = recipe_token_requirements(&json!({
        "color": "semantic.text.neutralMain",
        "c": "semantic.text.neutral.main"
    }));
    assert_eq!(tokens, "colors.semantic.text.neutral.main");
}

#[test]
fn a_recipe_does_not_require_an_alias_its_longhand_overrides() {
    let tokens = recipe_token_requirements(&json!({
        "c": "semantic.text.neutralMain",
        "color": "semantic.text.neutral.main"
    }));
    assert_eq!(tokens, "colors.semantic.text.neutral.main");
}
