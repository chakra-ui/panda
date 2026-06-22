use std::sync::Arc;

use insta::assert_debug_snapshot;
use pandacss_extractor::Literal;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use pandacss_utility::{Utility, UtilityOptions};
use serde_json::json;

use crate::common::utility_config;

#[test]
fn transform_expands_token_references_in_values() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#f00",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({})),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let result = utility
        .transform("color", &Literal::String("token(colors.red.500)".into()))
        .expect("transform");

    assert_debug_snapshot!(result, @r#"
    UtilityTransformResult {
        layer: None,
        class_name: "color_token(colors.red.500)",
        styles: Object(
            [
                (
                    "color",
                    String(
                        "var(--colors-red-500)",
                    ),
                ),
            ],
        ),
    }
    "#);
}

#[test]
fn transform_escapes_unresolved_token_reference_values() {
    let tokens = TokenDictionary::builder().build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "background": {
                "shorthand": "bg",
                "className": "bg"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let wrapped = utility
        .transform("bg", &Literal::String("{colors.missing.500}".into()))
        .expect("wrapped reference transform");
    let plain_wrapped = utility
        .transform("bg", &Literal::String("{plain}".into()))
        .expect("plain wrapped reference transform");
    let token_fn = utility
        .transform("bg", &Literal::String("token(colors.missing.500)".into()))
        .expect("token function transform");
    let token_fn_with_fallback = utility
        .transform(
            "bg",
            &Literal::String("token(colors.missing.500, var(--fallback))".into()),
        )
        .expect("token function fallback transform");

    assert_eq!(
        wrapped.styles,
        Literal::Object(vec![(
            "background".into(),
            Literal::String("colors\\.missing\\.500".into())
        )]),
    );
    assert_eq!(
        plain_wrapped.styles,
        Literal::Object(vec![("background".into(), Literal::String("plain".into()))]),
    );
    assert_eq!(
        token_fn.styles,
        Literal::Object(vec![(
            "background".into(),
            Literal::String("colors\\.missing\\.500".into())
        )]),
    );
    assert_eq!(
        token_fn_with_fallback.styles,
        Literal::Object(vec![(
            "background".into(),
            Literal::String("var(--fallback)".into())
        )]),
    );
}

#[test]
fn transform_resolves_token_function_fallbacks() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.300",
            "#f00",
            "var(--colors-red-300)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "colors.blue.300",
            "#00f",
            "var(--colors-blue-300)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "colors.green.300",
            "#0f0",
            "var(--colors-green-300)",
            TokenCategory::Colors,
        ))
        .build();
    let utility = Utility::from_config_with_options(
        &utility_config(json!({
            "border": {
                "className": "border"
            }
        })),
        UtilityOptions {
            tokens: Some(Arc::new(tokens)),
            ..UtilityOptions::default()
        },
    );

    let literal = utility
        .transform(
            "border",
            &Literal::String("1px solid token(colors.red.300, blue)".into()),
        )
        .expect("literal fallback transform");
    let token_ref = utility
        .transform(
            "border",
            &Literal::String("1px solid token(colors.red.300, colors.blue.300)".into()),
        )
        .expect("token fallback transform");
    let nested = utility
        .transform(
            "border",
            &Literal::String(
                "1px solid token(colors.red.300, token(colors.blue.300, colors.green.300))".into(),
            ),
        )
        .expect("nested fallback transform");

    assert_eq!(
        literal.styles,
        Literal::Object(vec![(
            "border".into(),
            Literal::String("1px solid var(--colors-red-300, blue)".into())
        )]),
    );
    assert_eq!(
        token_ref.styles,
        Literal::Object(vec![(
            "border".into(),
            Literal::String("1px solid var(--colors-red-300, var(--colors-blue-300))".into())
        )]),
    );
    assert_eq!(
        nested.styles,
        Literal::Object(vec![(
            "border".into(),
            Literal::String(
                "1px solid var(--colors-red-300, var(--colors-blue-300, var(--colors-green-300)))"
                    .into()
            )
        )]),
    );
}
