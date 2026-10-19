use std::sync::Arc;

use insta::{assert_debug_snapshot, assert_snapshot};
use pandacss_literal::Literal;
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

#[test]
fn token_references_report_each_reference_with_its_source_range() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#f00",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    let values = [
        "0 0 0 1px {colors.missing}",
        "1px solid token(colors.missing)",
        "calc(token( sizes.missing ) + 2px)",
        "token(colors.missing, red)",
        "1px solid token(colors.red.500, {colors.missing})",
        "token(colors.red.500, token(colors.missing))",
        "{colors.red.500/50} {colors.missing/50}",
        "{colors.red.500} {colors.missing}",
        "\"{ hello }\"",
        "\"{\" \"}\"",
        "{nodot}",
        "{colors.missing",
        "var(--colors-red-500)",
        "url(/img.v2.png)",
        "url(/a/mytoken(1).png)",
        "my-token(colors.missing) (token(colors.missing))",
    ];

    let found = values
        .iter()
        .map(|value| {
            let refs = pandacss_utility::token_references(value, &tokens)
                .into_iter()
                .map(|(path, range)| {
                    assert_eq!(&value[range], path);
                    format!("{path} resolved={}", tokens.token(path).is_some())
                })
                .collect::<Vec<_>>()
                .join(", ");
            format!("{value} -> [{refs}]")
        })
        .collect::<Vec<_>>()
        .join("\n");

    assert_snapshot!(found, @r#"
    0 0 0 1px {colors.missing} -> [colors.missing resolved=false]
    1px solid token(colors.missing) -> [colors.missing resolved=false]
    calc(token( sizes.missing ) + 2px) -> [sizes.missing resolved=false]
    token(colors.missing, red) -> [colors.missing resolved=false]
    1px solid token(colors.red.500, {colors.missing}) -> [colors.red.500 resolved=true, colors.missing resolved=false]
    token(colors.red.500, token(colors.missing)) -> [colors.red.500 resolved=true, colors.missing resolved=false]
    {colors.red.500/50} {colors.missing/50} -> [colors.red.500 resolved=true, colors.missing resolved=false]
    {colors.red.500} {colors.missing} -> [colors.red.500 resolved=true, colors.missing resolved=false]
    "{ hello }" -> []
    "{" "}" -> []
    {nodot} -> []
    {colors.missing -> []
    var(--colors-red-500) -> []
    url(/img.v2.png) -> []
    url(/a/mytoken(1).png) -> []
    my-token(colors.missing) (token(colors.missing)) -> [colors.missing resolved=false]
    "#);
}

#[test]
fn token_function_inside_a_longer_name_is_left_alone() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#f00",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    assert_eq!(
        pandacss_utility::expand_token_references_to_vars(
            "url(/a/mytoken(1).png) my-token(colors.red.500) token(colors.red.500)",
            &tokens,
        ),
        "url(/a/mytoken(1).png) my-token(colors.red.500) var(--colors-red-500)",
    );
}
