//! Spread props: style-only, conditional, and opaque spreads.

use super::common::transform_jsx;
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn rewrites_conditional_spread_on_jsx_element() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box {...(cond ? { color: 'a' } : { color: 'b' })} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={cond ? "color_a" : "color_b"} />;"#);
}

#[test]
fn static_object_spread_does_not_shift_conditional_jsx_spread() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box {...({ color: 'red' } as const)} {...(cond ? { padding: '1' } : { padding: '2' })} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={cond ? "color_red padding_1" : "color_red padding_2"} />;"#);
}

#[test]
fn rewrites_style_only_inline_object_spread() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box {...({ color: 'red' } as const)} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_red" />;"#);
}

#[test]
fn rewrites_style_only_identifier_spread_and_css_prop() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';

        const buttonBase = {
          display: 'inline-flex',
          alignItems: 'center',
          fontWeight: '600',
        } as const;

        const buttonPrimaryCss = {
          backgroundColor: 'blue.600',
          color: 'white',
        } as const;

        export const PrimaryButton = (props: { children?: React.ReactNode }) => (
          <styled.button type="button" {...buttonBase} css={buttonPrimaryCss}>
            {props.children}
          </styled.button>
        );
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    const buttonBase = {
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: '600',
    } as const;

    const buttonPrimaryCss = {
      backgroundColor: 'blue.600',
      color: 'white',
    } as const;

    export const PrimaryButton = (props: { children?: React.ReactNode }) => (
      <button type="button" className="align-items_center bg_blue.600 color_white d_inline-flex font-weight_600">
        {props.children}
      </button>
    );
    "#);
}

#[test]
fn opaque_identifier_spread_stays_unchanged() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box {...props} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { Box } from '@panda/jsx';
    export const el = <Box {...props} color="red" />;
    "#);
}

#[test]
fn identifier_spread_before_conditional_spread_rewrites() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';

        const base = { color: 'red' } as const;

        export const el = <Box {...base} {...(cond ? { padding: '1' } : { padding: '2' })} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    const base = { color: 'red' } as const;

    export const el = <div className={cond ? "color_red padding_1" : "color_red padding_2"} />;
    "#);
}

#[test]
fn static_object_spread_does_not_shift_conditional_runtime_spread() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, {
          ...({ color: 'red' }),
          ...(cond ? { padding: '1' } : { padding: '2' }),
          children: 'hi',
        });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: cond ? "color_red padding_1" : "color_red padding_2" });
    "#);
}

#[test]
fn mixed_spreads_with_static_runtime_or_opaque_props_stay_unchanged() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const staticRuntime = <Box {...{ color: 'red', onClick: handle }} {...(cond ? { padding: '1' } : { padding: '2' })} />;
        export const opaque = jsx(Box, { ...props, ...(cond ? { padding: '1' } : { padding: '2' }) });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';
    import { Box } from '@panda/jsx';

    export const staticRuntime = <Box {...{ color: 'red', onClick: handle }} {...(cond ? { padding: '1' } : { padding: '2' })} />;
    export const opaque = jsx(Box, { ...props, ...(cond ? { padding: '1' } : { padding: '2' }) });
    "#);
}

#[test]
fn conditional_jsx_spread_preserves_runtime_props_in_each_branch() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = (
          <Box
            data-before="kept"
            {...(active
              ? { id: 'on', 'aria-label': 'enabled', onClick: enable, color: 'red' }
              : { id: 'off', 'aria-label': 'disabled', onClick: disable, color: 'blue' })}
            title="after"
          />
        );
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    export const el = (
      <div data-before="kept" {...(active ? { id: 'on', 'aria-label': 'enabled', onClick: enable, className: "color_red" } : { id: 'off', 'aria-label': 'disabled', onClick: disable, className: "color_blue" })} title="after" />
    );
    "#);
}

#[test]
fn conditional_runtime_spread_preserves_runtime_props_in_each_branch() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, {
          'data-before': 'kept',
          ...(active
            ? { id: 'on', 'aria-label': 'enabled', onClick: enable, color: 'red' }
            : { id: 'off', 'aria-label': 'disabled', onClick: disable, color: 'blue' }),
          title: 'after',
        });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { 'data-before': 'kept', ...(active ? { id: 'on', 'aria-label': 'enabled', onClick: enable, className: "color_red" } : { id: 'off', 'aria-label': 'disabled', onClick: disable, className: "color_blue" }), title: 'after' });
    "#);
}

#[test]
fn conditional_jsx_spread_preserves_runtime_prop_overrides() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const before = <Box id="before" color="green" {...(active ? { id: 'on', color: 'red' } : { id: 'off', color: 'blue' })} />;
        export const after = <Box {...(active ? { id: 'on', color: 'red' } : { id: 'off', color: 'blue' })} id="after" color="green" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const before = <div id="before" {...(active ? { id: 'on', className: "color_red" } : { id: 'off', className: "color_blue" })} />;
    export const after = <div {...(active ? { id: 'on', className: "color_green" } : { id: 'off', className: "color_green" })} id="after" />;
    "#);
}

#[test]
fn style_only_jsx_spread_keeps_condition_evaluation_after_static_override() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box {...(recordAccess() ? { padding: '1' } : { padding: '2' })} padding="0" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={recordAccess() ? "padding_0" : "padding_0"} />;"#);
}

#[test]
fn conditional_jsx_spread_with_dynamic_duplicate_style_prop_stays_unchanged() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box {...(active
          ? { color: 'red', color: getColor(), id: 'on' }
          : { color: 'blue', id: 'off' })} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn direct_runtime_jsx_props_are_preserved_during_style_lowering() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" ref={ref} key="item" children="child" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div ref={ref} key="item" children="child" className="color_red" />;"#);
}

#[test]
fn rewrites_identifier_spread_with_overriding_ternary_props() {
    // The `<styled.li>` shape from css-in-js-bench multifile-composition: a
    // static spread, a ternary that overrides one of its keys, and two more
    // ternaries whose alternate is `undefined`.
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';

        const tabListItemStyle = {
          display: 'block',
          margin: '0',
          padding: '0',
          width: 'min-content',
          flexShrink: '0',
          minWidth: '40px',
        } as const;

        export const Tab = ({ fullWidth }: { fullWidth?: boolean }) => (
          <styled.li
            role="presentation"
            {...tabListItemStyle}
            display={fullWidth ? 'flex' : 'block'}
            flex={fullWidth ? '1' : undefined}
            justifyContent={fullWidth ? 'center' : undefined}
          />
        );
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"

    const tabListItemStyle = {
      display: 'block',
      margin: '0',
      padding: '0',
      width: 'min-content',
      flexShrink: '0',
      minWidth: '40px',
    } as const;

    export const Tab = ({ fullWidth }: { fullWidth?: boolean }) => (
      <li role="presentation" className={"flex-shrink_0 margin_0 min-width_40px padding_0 width_min-content" + " " + (fullWidth ? "d_flex" : "d_block") + (fullWidth ? " flex_1" : "") + (fullWidth ? " justify-content_center" : "")} />
    );
    "#);
}
