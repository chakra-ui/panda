use crate::common::{transform_recipes, transform_with_options};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_transformer::{TransformOptions, TransformTargets};

#[test]
fn rewrites_static_recipe_call_to_class_string() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { button } from '@panda/recipes';
    export const cls = "button button--size_sm";
    "#);
}

#[test]
fn applies_recipe_default_variants() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button();
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { button } from '@panda/recipes';
    export const cls = "button button--size_md";
    "#);
}

#[test]
fn leaves_dynamic_recipe_call_unchanged() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: props.size });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn skips_recipe_rewrites_when_only_css_target_is_enabled() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform_with_options(
        "src/button.tsx",
        source,
        TransformOptions {
            targets: TransformTargets {
                css: true,
                patterns: false,
                recipes: false,
                tokens: false,
                jsx: false,
            },
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}
