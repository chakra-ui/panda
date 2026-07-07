use crate::common::transform_with_options;
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_transformer::{HelperCxMode, TransformMode, TransformOptions, TransformTargets};

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
