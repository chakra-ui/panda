//! Solid and Qwik class-attribute conventions.

use super::common::{transform_jsx_qwik, transform_jsx_solid};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn rewrites_box_to_intrinsic_with_class_name_solid() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class="color_red" />;"#);
}

#[test]
fn merges_dynamic_class_expression_solid() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={props.class} color="red" />;
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={props.class + " color_red"} />;"#);
}

#[test]
fn rewrites_jsx_runtime_call_solid() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', class: 'color_red' });
    ");
}

#[test]
fn rewrites_box_to_intrinsic_with_class_name_qwik() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class="color_red" />;"#);
}

#[test]
fn merges_dynamic_class_expression_qwik() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={styles.container} color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={styles.container + " color_red"} />;"#);
}

#[test]
fn merges_resolved_class_into_qwik_array_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={[styles.container, 'p-8']} color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[styles.container, 'p-8', "color_red"]} />;"#);
}

#[test]
fn merges_resolved_class_into_qwik_mixed_array_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={[styles.container, 'p-8', flag ? 'a' : 'b', { active: true }]} color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[styles.container, 'p-8', flag ? 'a' : 'b', { active: true }, "color_red"]} />;"#);
}

#[test]
fn merges_qwik_class_collections_from_oxc_spans() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const withTrailingComma = <Box class={([styles.container,] as const)} color="red" />;
        export const empty = <Box class={([] as const)} color="blue" />;
        export const record = <Box class={({ active: true } as const)} color="green" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const withTrailingComma = <div class={([styles.container, "color_red",] as const)} />;
    export const empty = <div class={(["color_blue"] as const)} />;
    export const record = <div class={[({ active: true } as const), "color_green"]} />;
    "#);
}

#[test]
fn merges_resolved_class_into_qwik_record_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={{ 'text-red-500': isError, 'p-4': true }} color="blue" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[{ 'text-red-500': isError, 'p-4': true }, "color_blue"]} />;"#);
}
