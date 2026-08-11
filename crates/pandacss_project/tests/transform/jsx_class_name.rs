//! Merging Panda classes into an existing `className`, including escaping.

use super::common::{assert_reparses, transform_jsx, transform_jsx_with_helper};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn merges_existing_static_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="foo" color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="foo color_red" />;"#);
}

#[test]
fn merges_existing_class_name_with_style_props_and_css_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="foo" color="red" css={{ padding: '2' }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="foo color_red padding_2" />;"#);
}

#[test]
fn merges_dynamic_class_name_with_style_props_and_css_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color="red" css={{ padding: '2' }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_red padding_2"} />;"#);
}

#[test]
fn merges_dynamic_class_name_with_inline_concat() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_red"} />;"#);
}

#[test]
fn wraps_a_leading_ternary_class_name_before_appending() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={ok ? 'a' : 'b'} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={(ok ? 'a' : 'b') + " color_red"} />;"#);
}

/// Arbitrary values carry their punctuation into the class name, so a class
/// concatenated after a dynamic `className` has to be escaped like any other
/// JS string literal — otherwise the emitted file stops parsing.
#[test]
fn escapes_a_quoted_class_name_appended_after_an_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={'[var(--x, "red")]'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_[var(--x,_\"red\")]"} />;"#);
    assert_reparses(&output.code);
}

#[test]
fn escapes_a_backslash_in_a_class_name_appended_after_an_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={'[calc(1px\\2)]'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_[calc(1px\\2)]"} />;"#);
    assert_reparses(&output.code);
}

#[test]
fn escapes_a_quoted_class_name_without_the_cx_helper() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={'[var(--x, "red")]'} css={{ padding: '2' }} />;
    "#};

    let output =
        transform_jsx_with_helper("src/app.tsx", source, pandacss_project::HelperCxMode::False);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_[var(--x,_\"red\")] padding_2"} />;"#);
    assert_reparses(&output.code);
}

#[test]
fn escapes_a_quoted_class_name_through_the_cx_helper() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={'[var(--x, "red")]'} css={{ padding: '2' }} />;
    "#};

    let output =
        transform_jsx_with_helper("src/app.tsx", source, pandacss_project::HelperCxMode::True);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = <div className={__pcx(props.className, "color_[var(--x,_\"red\")] padding_2")} />;
    "#);
    assert_reparses(&output.code);
}

/// Extracted class values are raw source, so an entity has to stay in the
/// attribute form for JSX to keep decoding it.
#[test]
fn keeps_an_entity_class_name_in_the_attribute_form() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="a&amp;b" color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="a&amp;b color_red" />;"#);
}

#[test]
fn injects_cn_for_dynamic_class_name_with_conditional_style_prop() {
    use super::common::transform_jsx_with_helper;
    use pandacss_project::HelperCxMode;

    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = <div className={__pcx(props.className, isError ? "color_red" : "color_blue")} />;
    "#);
}

#[test]
fn similarly_named_class_helper_does_not_block_a_rewrite() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={notclsx(value)} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={notclsx(value) + " color_red"} />;"#);
}

#[test]
fn helper_text_inside_a_string_class_does_not_block_a_rewrite() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={'clsx('} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={'clsx(' + " color_red"} />;"#);
}
