use super::common::{patterns_only_options, transform, transform_with_options};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn rewrites_finite_conditional_css_value_to_runtime_ternary() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: isError ? 'red' : 'blue' });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = isError ? "color_red" : "color_blue";"#);
}

#[test]
fn leaves_unresolved_identifier_css_value_unchanged() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: tokenColor });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_css_raw_call_to_class_string() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = css.raw({ color: 'red', padding: '4px' });
    "#};

    let output = transform("src/styles.ts", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const styles = "color_red padding_4px";"#);
}

#[test]
fn rewrites_responsive_css_object_to_flat_classes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { base: 'red', md: 'blue' } });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "color_red md:color_blue";"#);
}

#[test]
fn rewrites_unknown_utility_property_using_fallback_class_name() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ unknownProp: 'value' });
    "#};

    let output = transform("src/button.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "unknown-prop_value";"#);
}

#[test]
fn rewrites_static_sites_without_marking_file_bailed_when_dynamic_call_is_unextractable() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        css({ color: 'red' });
        css({ color: props.color });
    "#};

    let output = transform("src/mixed.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert!(!output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { css } from '@panda/css';
    "color_red";
    css({ color: props.color });
    "#);
}

#[test]
fn skips_css_rewrites_when_only_patterns_target_is_enabled() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_with_options("src/button.tsx", source, patterns_only_options());

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}
