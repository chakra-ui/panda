use crate::common::create_project;
use pandacss_extractor::Literal;
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
