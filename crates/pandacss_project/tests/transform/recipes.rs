use super::common::{
    project_with_config_slot_recipe, project_with_rich_recipes, transform_recipes,
    transform_with_options,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{Project, TransformOptions, TransformTargets, transform_source};

/// Transform with all default targets on, the shape a real build sees.
fn transform_button(project: &Project, source: &str) -> pandacss_project::TransformOutput {
    transform_source(
        project,
        "src/button.tsx",
        source,
        &TransformOptions::default(),
    )
}

#[test]
fn rewrites_static_recipe_call_to_class_string() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_sm";"#);
}

#[test]
fn applies_recipe_default_variants() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button();
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_md";"#);
}

#[test]
fn selects_multiple_variants_in_one_call() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'lg', variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_lg button--variant_outline";"#);
}

#[test]
fn overrides_a_single_default_variant() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_md button--variant_outline";"#);
}

#[test]
fn applies_boolean_variant() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ block: true });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--block_true button--size_md button--variant_solid";"#);
}

#[test]
fn applies_compound_variant_when_combination_matches() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm', variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_sm button--variant_outline button--compound__size_sm__variant_outline";"#);
}

#[test]
fn omits_compound_variant_when_combination_does_not_match() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'lg', variant: 'outline' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_lg button--variant_outline";"#);
}

#[test]
fn rewrites_two_recipe_calls_in_one_file() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const small = button({ size: 'sm' });
        export const large = button({ size: 'lg' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const small = "button button--size_sm button--variant_solid";
    export const large = "button button--size_lg button--variant_solid";
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
fn leaves_unknown_recipe_call_unchanged() {
    let source = indoc! {r#"
        import { badge } from '@panda/recipes';
        export const cls = badge({ size: 'sm' });
    "#};

    let output = transform_button(&project_with_rich_recipes(), source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_config_slot_recipe_call_to_runtime() {
    let source = indoc! {r#"
        import { tabs } from '@panda/recipes';
        export const cls = tabs({ size: 'sm' });
    "#};

    let output = transform_button(&project_with_config_slot_recipe(), source);

    assert!(!output.changed);
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
