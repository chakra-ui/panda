//! End-to-end extraction through `Project`: extract → parse recipes
//! → encode atoms.

mod common;

use common::{create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use serde_json::json;

#[test]
fn parse_file_routes_css_cva_and_sva_to_the_right_pipelines() {
    // The interesting bit is the *atoms* the multi-call file
    // produces; routing counts are simple asserts.
    let mut project = create_project(json!({}));
    let src = indoc! {r"
        import { css, cva, sva } from '@panda/css';
        css({ color: 'red' });
        cva({ base: { padding: '4px' } });
        sva({ slots: ['root'], base: { root: { margin: '8px' } } });
    "};
    let report = project.parse_file("fixture.tsx", src);
    assert_eq!(report.css_calls, 1);
    assert_eq!(report.cva_calls, 1);
    assert_eq!(report.sva_calls, 1);
    assert_yaml_snapshot!(project.summary(), @r"
    filesProcessed: 1
    atomCount: 3
    recipeCount: 1
    slotRecipeCount: 1
    ");
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: margin
      value: 8px
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn jsx_style_props_feed_the_encoder() {
    // A JSX usage routes into the same encoder pipeline as css().
    let mut project = create_project(json!({}));
    let report = project.parse_file(
        "a.tsx",
        indoc! {r"
            import { Box } from '@panda/jsx';
            const el = <Box color='red' padding='4px' />;
        "},
    );
    assert_eq!(report.jsx_usages, 1);
    assert_eq!(report.css_calls, 0);
    assert_yaml_snapshot!(sorted_atoms(&project), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn recipes_iterator_yields_typed_recipe_per_call_site() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            const button = cva({
              base: { color: 'red' },
              variants: { size: { sm: { fontSize: 12 } } },
            });
        "},
    );
    let recipes: Vec<_> = project
        .recipes()
        .map(|(file, _span, recipe)| (file.to_owned(), recipe.clone()))
        .collect();
    assert_yaml_snapshot!(recipes, @r"
    - - button.tsx
      - base:
          color: red
        variants:
          - name: size
            options:
              - key: sm
                style:
                  fontSize: 12
    ");
}

#[test]
fn builder_attaches_token_dictionary() {
    use pandacss_encoder::AtomValue;
    use pandacss_tokens::{Token, TokenCategory, TokenDictionary};

    let dict = TokenDictionary::builder()
        .insert(Token::new(
            "colors.red.500",
            "#ef4444",
            "var(--colors-red-500)",
            TokenCategory::Colors,
        ))
        .build();

    let mut project = create_project(json!({})).with_token_dictionary(dict);
    project.parse_file(
        "fixture.tsx",
        indoc! {r"
            import { token } from '@panda/tokens';
            import { css } from '@panda/css';
            css({ color: token('colors.red.500') });
        "},
    );
    let color = project
        .atoms()
        .iter()
        .find(|a| a.prop() == "color")
        .expect("color atom");
    assert!(
        matches!(color.value(), AtomValue::String(s) if &**s == "#ef4444"),
        "token() resolved to dictionary value, got {:?}",
        color.value(),
    );
}

#[test]
fn complex_recipe_decomposes_into_many_atoms() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { cva } from '@panda/css';
            cva({
              base: { display: 'inline-flex', alignItems: 'center' },
              variants: {
                intent: {
                  primary: { background: 'blue', color: 'white' },
                  danger: { background: 'red', color: 'white' },
                },
                size: {
                  sm: { fontSize: 12 },
                  lg: { fontSize: 16 },
                },
              },
              compoundVariants: [
                { intent: 'danger', size: 'lg', css: { fontWeight: 'bold' } },
              ],
            });
        "},
    );
    assert_yaml_snapshot!(sorted_atoms(&project), @r#"
    - prop: alignItems
      value: center
      conditions: []
    - prop: background
      value: blue
      conditions: []
    - prop: background
      value: red
      conditions: []
    - prop: color
      value: white
      conditions: []
    - prop: display
      value: inline-flex
      conditions: []
    - prop: fontSize
      value: "12"
      conditions: []
    - prop: fontSize
      value: "16"
      conditions: []
    - prop: fontWeight
      value: bold
      conditions: []
    "#);
}
