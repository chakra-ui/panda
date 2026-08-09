//! `jsx()` / `createElement()` runtime call rewriting.

use super::common::transform_jsx;
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn rewrites_jsx_runtime_call() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: 'color_red' });
    ");
}

#[test]
fn rewrites_create_element_call() {
    let source = indoc! {r#"
        import React from 'react';
        import { Box } from '@panda/jsx';

        export const el = React.createElement(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import React from 'react';

    export const el = React.createElement('div', { children: 'hi', className: 'color_red' });
    ");
}

#[test]
fn runtime_call_respects_static_as_component() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { as: Link, color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx(Link, { children: 'hi', className: 'color_red' });
    ");
}

#[test]
fn runtime_call_respects_static_as_string_on_styled() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { styled } from '@panda/jsx';

        export const el = jsx(styled.a, { as: 'button', color: 'red', type: 'submit' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('button', { type: 'submit', className: 'color_red' });
    ");
}

#[test]
fn runtime_mixed_static_and_dynamic_calls() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        jsx(Box, { color: 'red' });
        jsx(Box, { color: props.color });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';
    import { Box } from '@panda/jsx';

    jsx('div', { className: 'color_red' });
    jsx(Box, { color: props.color });
    "#);
}

#[test]
fn rewrites_runtime_call_with_finite_conditional_prop() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: isError ? 'red' : 'blue', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: isError ? "color_red" : "color_blue" });
    "#);
}

#[test]
fn rewrites_runtime_call_with_deeply_nested_conditional_prop() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, {
            _hover: { _dark: { color: isDark ? 'white' : 'black' } },
            children: 'hi',
        });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: isDark ? "hover:dark:color_white" : "hover:dark:color_black" });
    "#);
}

#[test]
fn runtime_call_with_a_computed_property_stays_unchanged() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';
        export const el = jsx(Box, { color: 'red', [runtimeKey]: value });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';
    import { Box } from '@panda/jsx';
    export const el = jsx(Box, { color: 'red', [runtimeKey]: value });
    "#);
}
