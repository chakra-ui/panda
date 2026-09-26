//! Solid and Qwik class-attribute conventions.

use super::common::transform_jsx_for_framework;
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn solid_box_becomes_a_div_with_a_class_attribute() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx_for_framework("solid", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class="color_red" />;"#);
}

#[test]
fn solid_appends_panda_classes_to_a_dynamic_class() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={props.class} color="red" />;
    "#};

    let output = transform_jsx_for_framework("solid", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={props.class + " color_red"} />;"#);
}

#[test]
fn solid_jsx_runtime_call_gets_a_class_prop() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx_for_framework("solid", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', class: 'color_red' });
    ");
}

#[test]
fn qwik_box_becomes_a_div_with_a_class_attribute() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx_for_framework("qwik", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class="color_red" />;"#);
}

#[test]
fn qwik_appends_panda_classes_to_a_dynamic_class() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={styles.container} color="red" />;
    "#};

    let output = transform_jsx_for_framework("qwik", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={styles.container + " color_red"} />;"#);
}

#[test]
fn qwik_appends_panda_classes_to_a_class_array() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={[styles.container, 'p-8']} color="red" />;
    "#};

    let output = transform_jsx_for_framework("qwik", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[styles.container, 'p-8', "color_red"]} />;"#);
}

#[test]
fn qwik_appends_panda_classes_to_a_mixed_class_array() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={[styles.container, 'p-8', flag ? 'a' : 'b', { active: true }]} color="red" />;
    "#};

    let output = transform_jsx_for_framework("qwik", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[styles.container, 'p-8', flag ? 'a' : 'b', { active: true }, "color_red"]} />;"#);
}

#[test]
fn qwik_appends_panda_classes_to_typed_and_empty_class_collections() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const withTrailingComma = <Box class={([styles.container,] as const)} color="red" />;
        export const empty = <Box class={([] as const)} color="blue" />;
        export const record = <Box class={({ active: true } as const)} color="green" />;
    "#};

    let output = transform_jsx_for_framework("qwik", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const withTrailingComma = <div class={([styles.container, "color_red",] as const)} />;
    export const empty = <div class={(["color_blue"] as const)} />;
    export const record = <div class={[({ active: true } as const), "color_green"]} />;
    "#);
}

#[test]
fn qwik_wraps_a_class_record_in_an_array_with_panda_classes() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={{ 'text-red-500': isError, 'p-4': true }} color="blue" />;
    "#};

    let output = transform_jsx_for_framework("qwik", "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[{ 'text-red-500': isError, 'p-4': true }, "color_blue"]} />;"#);
}
