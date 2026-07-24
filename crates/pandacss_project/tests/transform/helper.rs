//! Integration tests for helper import injection and `needs_cx` metadata.

use super::common::{transform_jsx, transform_jsx_with_helper};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{
    CX_HELPER_LOCAL, CX_HELPER_MODULE, HelperCxMode, TransformHelperFacts, inject_cx_import,
    sync_internal_css_import,
};

#[test]
fn helper_module_constants_match_injected_import() {
    assert_eq!(CX_HELPER_MODULE, "@pandacss-internal/css");
    assert_eq!(CX_HELPER_LOCAL, "__pcx");
    assert_snapshot!(inject_cx_import("export const x = __pcx('a');\n"), @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const x = __pcx('a');
    "#);
}

#[test]
fn static_jsx_never_requests_cn_or_injects_import() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="foo" color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"export const el = <div className="foo color_red" />;"#);
}

#[test]
fn helper_cx_false_keeps_inline_merge_for_dynamic_and_conditional() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::False);

    assert!(output.changed);
    assert!(!output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " " + (isError ? "color_red" : "color_blue")} />;"#);
}

#[test]
fn helper_cx_true_uses_cx_for_dynamic_and_static_peel() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color="red" />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::True);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = <div className={__pcx(props.className, "color_red")} />;
    "#);
}

#[test]
fn inject_cx_import_does_not_duplicate_existing_import() {
    let source = indoc! {r#"
        import { cx as __pcx } from '@pandacss-internal/css';
        export const cls = __pcx('a', 'b');
    "#};

    assert_snapshot!(inject_cx_import(source), @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const cls = __pcx('a', 'b');
    "#);
}

#[test]
fn inject_cx_import_adds_import_before_existing_code() {
    let source = "export const cls = __pcx('a');\n";

    assert_snapshot!(inject_cx_import(source), @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const cls = __pcx('a');
    "#);
}

#[test]
fn inject_cx_import_respects_directive_prologue() {
    let source = "\"use client\";\n\nexport const cls = __pcx('a');\n";

    assert_snapshot!(inject_cx_import(source), @r#"
    "use client";
    import { cx as __pcx } from '@pandacss-internal/css';

    export const cls = __pcx('a');
    "#);
}

#[test]
fn inject_cx_import_stays_outside_a_multiline_directive_comment() {
    let source = "\"use client\" /* keep\nthis comment */\nexport const cls = __pcx('a');\n";

    assert_snapshot!(inject_cx_import(source), @r#"
    "use client" /* keep
    this comment */
    import { cx as __pcx } from '@pandacss-internal/css';
    export const cls = __pcx('a');
    "#);
}

#[test]
fn inject_cx_import_separates_an_unterminated_directive() {
    let output = sync_internal_css_import(
        "\"use client\"",
        "fixture.ts",
        &TransformHelperFacts {
            needs_cx: true,
            ..Default::default()
        },
        HelperCxMode::Auto,
    );

    assert_snapshot!(output, @r#"
    "use client"
    import { cx as __pcx } from '@pandacss-internal/css';
    "#);
}

#[test]
fn auto_injects_cn_for_dynamic_class_name_and_conditional_style_prop() {
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
fn auto_injects_cn_for_peeled_static_styles_with_dynamic_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} padding="4px" color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = <div className={__pcx(props.className, isError ? "color_red padding_4px" : "color_blue padding_4px")} />;
    "#);
}

#[test]
fn auto_injects_cn_for_four_conditionals_with_dynamic_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = (
          <Box
            className={props.className}
            color={a ? 'red' : 'blue'}
            bg={b ? 'white' : 'black'}
            padding={c ? '1' : '2'}
            margin={d ? '3' : '4'}
          />
        );
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = (
      <div className={__pcx(props.className, (a ? "color_red" : "color_blue") + " " + (b ? "bg_white" : "bg_black") + " " + (c ? "padding_1" : "padding_2") + " " + (d ? "margin_3" : "margin_4"))} />
    );
    "#);
}

#[test]
fn auto_injects_cn_for_runtime_jsx_call_with_dynamic_and_conditional_props() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, {
          className: props.className,
          color: isError ? 'red' : 'blue',
          children: 'hi',
        });
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: __pcx(props.className, isError ? "color_red" : "color_blue") });
    "#);
}

#[test]
fn true_mode_injects_cn_for_runtime_create_element_call() {
    let source = indoc! {r#"
        import React from 'react';
        import { Box } from '@panda/jsx';

        export const el = React.createElement(Box, {
          className: props.className,
          color: 'red',
          children: 'hi',
        });
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::True);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import React from 'react';

    export const el = React.createElement('div', { children: 'hi', className: __pcx(props.className, "color_red") });
    "#);
}

#[test]
fn mixed_jsx_file_injects_cn_once_for_elements_that_need_it() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const staticEl = <Box color="red" />;
        export const dynamicEl = <Box className={props.className} color={isError ? 'red' : 'blue'} />;
        export const inlineEl = <Box className={props.className} color="green" />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const staticEl = <div className="color_red" />;
    export const dynamicEl = <div className={__pcx(props.className, isError ? "color_red" : "color_blue")} />;
    export const inlineEl = <div className={props.className + " color_green"} />;
    "#);
}

#[test]
fn auto_injects_cn_for_nested_hover_conditional_with_dynamic_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = (
          <Box
            className={props.className}
            color="blue"
            _hover={{ color: isDark ? 'white' : 'black' }}
          />
        );
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = (
      <div className={__pcx(props.className, isDark ? "color_blue hover:color_white" : "color_blue hover:color_black")} />
    );
    "#);
}

#[test]
fn auto_injects_cn_for_deeply_nested_hover_dark_conditional() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = (
          <Box
            className={props.className}
            _hover={{ _dark: { color: isDark ? 'white' : 'black' } }}
          />
        );
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = (
      <div className={__pcx(props.className, isDark ? "hover:dark:color_white" : "hover:dark:color_black")} />
    );
    "#);
}

#[test]
fn cn_false_never_injects_helper_import() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::False);

    assert!(output.changed);
    assert!(!output.helper.needs_cx);
    assert!(!output.code.contains("@pandacss-internal/css"));
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " " + (isError ? "color_red" : "color_blue")} />;"#);
}
