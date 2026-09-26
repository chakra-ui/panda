use super::common::{project_with_tokens, transform_with_project};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_transform::{TransformOptions, TransformTargets, transform_source};

fn transform_tokens(source: &str) -> pandacss_transform::TransformOutput {
    transform_with_project(&project_with_tokens(), "src/theme.ts", source)
}

#[test]
fn inlines_token_call_to_its_value() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const red = token('colors.red.500');
    "#};

    let output = transform_tokens(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r##"export const red = "#ef4444";"##);
}

#[test]
fn inlines_token_var_call_to_css_var() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const red = token.var('colors.red.500');
    "#};

    let output = transform_tokens(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const red = "var(--colors-red-500)";"#);
}

#[test]
fn inlines_conditional_token_calls_to_their_own_css_vars() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const primary = token('colors.primary');
        export const onlyDark = token('colors.onlyDark');
    "#};

    let output = transform_tokens(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const primary = "var(--colors-primary)";
    export const onlyDark = "var(--colors-only-dark)";
    "#);
}

#[test]
fn uses_fallback_for_missing_token() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const c = token('colors.missing', 'blue');
    "#};

    let output = transform_tokens(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const c = "blue";"#);
}

#[test]
fn leaves_unresolved_token_without_fallback_unchanged() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const c = token('colors.missing');
    "#};

    let output = transform_tokens(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_dynamic_token_path_unchanged() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const c = token(dynamicPath);
    "#};

    let output = transform_tokens(source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn inlines_token_beside_dynamic_code_in_a_plain_object() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const theme = { brand: token('colors.red.500'), custom: props.w };
    "#};

    let output = transform_tokens(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r##"export const theme = { brand: "#ef4444", custom: props.w };"##);
}

#[test]
fn does_not_double_rewrite_a_token_inside_a_rewritten_css_call() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { token } from '@panda/tokens';
        export const cls = css({ color: token('colors.red.500') });
    "#};

    let output = transform_tokens(source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "color_#ef4444";"#);
}

#[test]
fn skips_token_rewrites_when_only_css_target_is_enabled() {
    let source = indoc! {r#"
        import { token } from '@panda/tokens';
        export const red = token('colors.red.500');
    "#};

    let output = transform_source(
        project_with_tokens().system(),
        "src/theme.ts",
        source,
        &TransformOptions {
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
