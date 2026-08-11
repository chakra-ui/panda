//! Mixed static + dynamic `css()` calls: resolve the static props and keep the
//! open-ended dynamic remainder in a runtime `css()` call, merged by `cx`.

use super::common::{project, transform};
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_project::{HelperCxMode, TransformOptions, TransformTargets, transform_source};

fn css(source: &str) -> pandacss_project::TransformOutput {
    transform("src/x.tsx", source)
}

// ─── split cases: static inlined, dynamic kept in runtime css(), joined by cx ───

#[test]
fn splits_one_static_and_one_dynamic_prop() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ width: props.w }));
    "#);
}

#[test]
fn splits_with_dynamic_prop_declared_first() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ width: props.w, color: 'red' });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ width: props.w }));
    "#);
}

#[test]
fn splits_multiple_static_and_one_dynamic() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', padding: '2', margin: '4', width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red margin_4 padding_2", css({ width: props.w }));
    "#);
}

#[test]
fn splits_one_static_and_multiple_dynamic() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', width: props.w, padding: props.p });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ width: props.w, padding: props.p }));
    "#);
}

#[test]
fn splits_with_member_expression_value() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', margin: theme.space });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ margin: theme.space }));
    "#);
}

#[test]
fn splits_with_call_expression_value() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', padding: getPadding() });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ padding: getPadding() }));
    "#);
}

#[test]
fn splits_with_template_literal_value() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', margin: `${gap}px` });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ margin: `${gap}px` }));
    "#);
}

#[test]
fn splits_preserves_aliased_css_callee() {
    let out = css(indoc! {r#"
        import { css as ncss } from '@panda/css';
        export const cls = ncss({ color: 'red', width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css as ncss } from '@panda/css';
    export const cls = __pcx("color_red", ncss({ width: props.w }));
    "#);
}

#[test]
fn splits_preserves_namespace_css_callee() {
    let out = css(indoc! {r#"
        import * as p from '@panda/css';
        export const cls = p.css({ color: 'red', width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import * as p from '@panda/css';
    export const cls = __pcx("color_red", p.css({ width: props.w }));
    "#);
}

#[test]
fn moves_fully_dynamic_nested_object_to_runtime_css() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', _hover: { color: props.c } });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ _hover: { color: props.c } }));
    "#);
}

#[test]
fn splits_static_condition_prefix_with_top_level_dynamic() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { color: 'red' }, width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("hover:color_red", css({ width: props.w }));
    "#);
}

#[test]
fn splits_with_important_static_prop() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red!', width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red!", css({ width: props.w }));
    "#);
}

#[test]
fn splits_with_arbitrary_selector_static_prop() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ ['&:hover']: { color: 'red' }, width: props.w });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("[&:hover]:color_red", css({ width: props.w }));
    "#);
}

#[test]
fn splits_injects_the_cx_helper_import() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', width: props.w });
    "#});
    assert!(out.changed);
    assert!(out.code.contains("__pcx"));
    assert!(
        out.code.contains("cx as __pcx"),
        "cx import should be injected: {}",
        out.code
    );
}

// ─── bail cases: leave the call untouched, never drop a dynamic prop ───

#[test]
fn bails_on_fully_dynamic_object() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: props.c });
    "#};
    let out = css(source);
    assert!(!out.changed);
    assert_eq!(out.code, source);
}

#[test]
fn bails_on_nested_partial_object() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', _hover: { color: 'blue', padding: props.p } });
    "#};
    let out = css(source);
    assert!(!out.changed);
    assert_eq!(out.code, source);
}

#[test]
fn bails_on_deeply_nested_partial_object() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { _dark: { color: 'red', margin: props.m } } });
    "#};
    let out = css(source);
    assert!(!out.changed);
    assert_eq!(out.code, source);
}

#[test]
fn bails_on_mixed_object_when_cx_helper_disabled() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', width: props.w });
    "#};
    let out = transform_source(
        &project(),
        "src/x.tsx",
        source,
        &TransformOptions {
            helper_cx: HelperCxMode::False,
            targets: TransformTargets::default(),
            ..TransformOptions::default()
        },
    );
    assert!(!out.changed);
    assert_eq!(out.code, source);
}

// ─── unchanged behavior: static-only, conditional, multi-arg ───

#[test]
fn fully_static_object_inlines_without_cx() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', padding: '2' });
    "#});
    assert!(out.changed);
    assert!(!out.code.contains("__pcx"));
    assert_snapshot!(out.code, @r#"export const cls = "color_red padding_2";"#);
}

#[test]
fn finite_conditional_stays_a_ternary_not_a_split() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: isError ? 'red' : 'blue' });
    "#});
    assert!(out.changed);
    assert!(!out.code.contains("__pcx"));
    assert_snapshot!(out.code, @r#"export const cls = isError ? "color_red" : "color_blue";"#);
}

#[test]
fn arbitrary_selector_only_object_inlines_static() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ ['&:data-panda']: { display: 'flex' } });
    "#});
    assert!(out.changed);
    assert!(!out.code.contains("__pcx"));
    assert_snapshot!(out.code, @r#"export const cls = "[&:data-panda]:d_flex";"#);
}

#[test]
fn multi_arg_css_is_not_split() {
    // Multi-arg css() keeps existing behavior (no cx split path).
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' }, { padding: '2' });
    "#});
    assert!(out.changed);
    assert!(!out.code.contains("__pcx"));
    assert_snapshot!(out.code, @r#"export const cls = "color_red padding_2";"#);
}

#[test]
fn dynamic_value_kept_verbatim_in_runtime_css() {
    // The dynamic prop source is copied through unchanged, including the callee.
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', gridTemplate: computeGrid(props.cols) });
    "#});
    assert!(out.changed);
    assert_snapshot!(out.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    export const cls = __pcx("color_red", css({ gridTemplate: computeGrid(props.cols) }));
    "#);
}

// ─── css composition through a component prop ───

#[test]
fn css_prop_forwarded_through_typed_destructured_param_is_not_dropped() {
    // `{ css?: any }` is a type annotation, not a value. Folding it to an
    // empty object dropped `cssProp` and lost every style the caller passed.
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        const base = { color: 'red' };
        export const L0 = ({ css: cssProp, children }: { css?: any; children?: any }) => (
          <button className={css(base, cssProp)}>{children}</button>
        );
    "#});
    assert!(!out.bailed);
    assert!(out.code.contains("css(base, cssProp)"), "{}", out.code);
}

#[test]
fn typed_destructured_param_with_concrete_type_is_not_dropped() {
    let out = css(indoc! {r#"
        import { css } from '@panda/css';
        const base = { color: 'red' };
        export const L0 = ({ extra }: { extra?: Record<string, string> }) =>
          css(base, extra);
    "#});
    assert!(!out.bailed);
    assert!(out.code.contains("css(base, extra)"), "{}", out.code);
}
