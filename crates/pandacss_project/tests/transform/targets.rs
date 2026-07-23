use super::common::{
    project_with_pattern, project_with_recipes, project_with_tokens, transform_with_options,
    transform_with_project,
};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{HelperCxMode, TransformMode, TransformOptions, TransformTargets};

#[test]
fn build_mode_is_default() {
    let options = TransformOptions::default();
    assert_eq!(options.mode, TransformMode::Build);
    assert_eq!(options.helper_cx, HelperCxMode::Auto);
}

#[test]
fn default_targets_enable_css_transforms() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_with_options("src/button.tsx", source, TransformOptions::default());

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "color_red";"#);
}

#[test]
fn default_targets_enable_pattern_transforms() {
    let source = indoc! {r#"
        import { box } from '@panda/patterns';
        export const cls = box({ padding: '4px' });
    "#};

    let output = transform_with_project(&project_with_pattern(), "src/layout.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "padding_4px";"#);
}

#[test]
fn default_targets_enable_recipe_transforms() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform_with_project(&project_with_recipes(), "src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_sm";"#);
}

#[test]
fn default_targets_enable_token_transforms() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const red = token('colors.red.500');
    "#};

    let output = transform_with_project(&project_with_tokens(), "src/theme.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r##"export const red = "#ef4444";"##);
}

#[test]
fn explicit_css_target_still_rewrites() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
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

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "color_red";"#);
}
