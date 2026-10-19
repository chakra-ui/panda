use crate::common::create_project;
use pandacss_literal::Literal;
use pandacss_project::{ResolvedUtilityValue, UtilityValueSource};
use pandacss_shared::to_hash;
use serde_json::json;

#[test]
fn resolve_utility_value_uses_project_config() {
    let project = create_project(json!({
        "utilities": {
            "marginBottom": {
                "className": "mb",
                "shorthand": "mb",
                "values": {
                    "2": "0.5rem"
                }
            }
        }
    }));

    let resolved = project
        .resolve_utility_value("mb", &Literal::String("0.5rem".into()))
        .expect("resolved utility value");

    assert_eq!(resolved.utility, "marginBottom");
    assert_eq!(resolved.class_name, "mb_0.5rem");
    assert_eq!(
        resolved.source,
        UtilityValueSource::Literal {
            aliases: vec!["2".into()]
        }
    );
}

#[test]
fn resolve_utility_value_formats_prefix_and_separator() {
    let project = create_project(json!({
        "prefix": {
            "className": "pd"
        },
        "separator": "__",
        "utilities": {
            "opacity": {
                "className": "op"
            }
        }
    }));

    let resolved = project
        .resolve_utility_value("opacity", &Literal::Number(0.5))
        .expect("resolved utility value");

    assert_eq!(resolved.utility, "opacity");
    assert_eq!(resolved.class_name, "pd-op__0.5");
    assert_eq!(resolved.css_value, Literal::String("0.5".into()));
    assert_eq!(
        resolved,
        ResolvedUtilityValue {
            utility: "opacity".into(),
            class_name: "pd-op__0.5".into(),
            css_value: Literal::String("0.5".into()),
            important: false,
            source: UtilityValueSource::Literal { aliases: vec![] },
            tokens: vec![],
        }
    );
}

#[test]
fn resolve_utility_value_hashes_class_names_when_enabled() {
    let project = create_project(json!({
        "hash": {
            "className": true
        },
        "prefix": {
            "className": "pd"
        },
        "utilities": {
            "opacity": {
                "className": "op"
            }
        }
    }));

    let resolved = project
        .resolve_utility_value("opacity", &Literal::Number(0.5))
        .expect("resolved utility value");

    assert_eq!(resolved.class_name, format!("pd-{}", to_hash("op_0.5")));
}

#[test]
fn resolve_utility_value_returns_none_for_non_scalar_values() {
    let project = create_project(json!({
        "utilities": {
            "width": {
                "className": "w"
            },
            "hideFrom": {
                "className": "hide",
                "values": {
                    "sm": {
                        "@breakpoint sm": {
                            "display": "none"
                        }
                    }
                }
            }
        }
    }));

    assert!(
        project
            .resolve_utility_value("width", &Literal::Null)
            .is_none()
    );
    assert!(
        project
            .resolve_utility_value(
                "width",
                &Literal::Array(vec![Literal::String("4px".into())])
            )
            .is_none()
    );
    assert!(
        project
            .resolve_utility_value(
                "width",
                &Literal::Object(vec![("base".into(), Literal::String("4px".into()))])
            )
            .is_none()
    );
    assert!(
        project
            .resolve_utility_value("hideFrom", &Literal::String("sm".into()))
            .is_none()
    );
}

fn token_project() -> pandacss_project::Project {
    create_project(json!({
        "theme": {
            "tokens": {
                "colors": { "red": { "500": { "value": "#f00" } } },
                "spacing": { "2": { "value": "8px" } }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "outlineOffset": { "className": "ring-o", "values": "spacing" },
            "marginTop": {
                "className": "mt",
                "values": {
                    "auto": "auto",
                    "2": "var(--spacing-2)",
                    "-2": "calc(var(--spacing-2) * -1)"
                }
            }
        }
    }))
}

fn resolved_tokens(project: &pandacss_project::Project, prop: &str, value: &str) -> Vec<String> {
    project
        .resolve_utility_value(prop, &Literal::String(value.into()))
        .expect("resolved utility value")
        .tokens
}

#[test]
fn negative_spacing_from_a_token_category_reports_its_token() {
    let project = token_project();
    assert_eq!(
        resolved_tokens(&project, "outlineOffset", "-2"),
        ["spacing.-2"]
    );
}

#[test]
fn negative_spacing_from_a_theme_value_map_reports_its_token() {
    let project = token_project();
    assert_eq!(resolved_tokens(&project, "marginTop", "2"), ["spacing.2"]);
    assert_eq!(resolved_tokens(&project, "marginTop", "-2"), ["spacing.-2"]);
}

#[test]
fn color_with_opacity_modifier_reports_its_base_token() {
    let project = token_project();
    assert_eq!(
        resolved_tokens(&project, "color", "red.500/40"),
        ["colors.red.500"]
    );
}

#[test]
fn token_reference_syntax_reports_its_token() {
    let project = token_project();
    assert_eq!(
        resolved_tokens(&project, "color", "{colors.red.500}"),
        ["colors.red.500"]
    );
}

#[test]
fn value_composed_of_several_tokens_reports_each_once() {
    let project = token_project();
    assert_eq!(
        resolved_tokens(&project, "border", "1px solid {colors.red.500}"),
        ["colors.red.500"]
    );
    assert_eq!(
        resolved_tokens(&project, "margin", "{spacing.2} {spacing.-2} {spacing.2}"),
        ["spacing.2", "spacing.-2"]
    );
    assert_eq!(
        resolved_tokens(&project, "margin", "{spacing.-2} auto"),
        ["spacing.-2"]
    );
}

#[test]
fn token_function_reports_its_token_and_token_fallback() {
    let project = token_project();
    assert_eq!(
        resolved_tokens(&project, "marginTop", "calc(token(spacing.2, 8px) * -1)"),
        ["spacing.2"]
    );
    assert_eq!(
        resolved_tokens(&project, "color", "token(colors.brand, {colors.red.500})"),
        ["colors.red.500"]
    );
}

#[test]
fn hand_written_css_vars_and_strings_report_no_token() {
    let project = token_project();
    assert!(resolved_tokens(&project, "marginTop", "calc(var(--spacing-2) * 2)").is_empty());
    assert!(resolved_tokens(&project, "content", "\"var(--colors-red-500)\"").is_empty());
}

#[test]
fn raw_and_arbitrary_values_report_no_token() {
    let project = token_project();
    assert!(resolved_tokens(&project, "marginTop", "auto").is_empty());
    assert!(resolved_tokens(&project, "marginTop", "[2px]").is_empty());
    assert!(resolved_tokens(&project, "marginTop", "[calc(2px * -1)]").is_empty());
    assert!(resolved_tokens(&project, "color", "#f00").is_empty());
}
