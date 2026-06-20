use insta::assert_yaml_snapshot;
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use serde_json::json;

#[test]
fn token_dictionary_exposes_type_data() {
    let dict = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .insert(Token::new(
            "spacing.4",
            "1rem",
            "var(--spacing-4)",
            TokenCategory::Spacing,
        ))
        .build();

    assert_yaml_snapshot!(json!(dict.type_data()), @r##"
    categories:
      colors:
        name: colors
        typeName: ColorToken
        values:
          - red.500
      spacing:
        name: spacing
        typeName: SpacingToken
        values:
          - "4"
    colorPalettes: []
    values:
      colors.red.500: "#ef4444"
      spacing.4: 1rem
    deprecated: {}
    "##);
}

#[test]
fn type_data_exposes_deprecation_flag_and_message() {
    let dict = TokenDictionary::builder()
        .insert(
            Token::new(
                "colors.old",
                "#000",
                "var(--colors-old)",
                TokenCategory::Colors,
            )
            .deprecated(),
        )
        .insert(
            Token::new(
                "colors.legacy",
                "#111",
                "var(--colors-legacy)",
                TokenCategory::Colors,
            )
            .deprecated_with_reason("use colors.fg instead"),
        )
        .build();

    assert_yaml_snapshot!(json!(dict.type_data())["deprecated"], @r###"
    colors.legacy: use colors.fg instead
    colors.old: true
    "###);
}
