//! Folding static styles past an opaque rest-props spread.

use super::common::{transform_jsx, transform_jsx_solid, transform_jsx_with_helper};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn folds_static_styles_past_an_opaque_rest_props_spread() {
    // The `<styled.button>` shape from css-in-js-bench multifile-composition:
    // an opaque rest-props spread sits *before* every style prop, so the props
    // it carries lose to them. The factory and the spread stay for runtime
    // style props; everything else is precomputed.
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';

        const tabBaseStyle = { borderStyle: 'none' } as const;
        const normalTabStyle = { height: '40px', color: 'rgba(0, 0, 0, 0.6)' } as const;
        const activeTabStyle = { color: '#000' } as const;
        const activeTabCss = { _hover: { borderBottomColor: '#eeb524' } } as const;

        export const Tab = ({ disabled, fullWidth, ...props }) => (
          <styled.button
            {...props}
            type="button"
            role="tab"
            disabled={disabled}
            tabIndex={0}
            flex={fullWidth ? '1' : undefined}
            {...tabBaseStyle}
            {...normalTabStyle}
            {...activeTabStyle}
            css={activeTabCss}
          />
        );
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';

    const tabBaseStyle = { borderStyle: 'none' } as const;
    const normalTabStyle = { height: '40px', color: 'rgba(0, 0, 0, 0.6)' } as const;
    const activeTabStyle = { color: '#000' } as const;
    const activeTabCss = { _hover: { borderBottomColor: '#eeb524' } } as const;

    export const Tab = ({ disabled, fullWidth, ...props }) => (
      <styled.button {...props} type="button" role="tab" disabled={disabled} tabIndex={0} className={__pcx(fullWidth ? "border-style_none color_#000 flex_1 height_40px hover:border-bottom-color_#eeb524" : "border-style_none color_#000 height_40px hover:border-bottom-color_#eeb524", props?.className)} />
    );
    "#);
}

#[test]
fn partial_fold_keeps_children_and_the_closing_tag() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = (props) => <styled.button {...props} color="red">Go</styled.button>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    export const Btn = (props) => <styled.button {...props} className={__pcx('color_red', props?.className)}>Go</styled.button>;
    ");
}

#[test]
fn a_style_prop_before_the_opaque_spread_blocks_the_partial_fold() {
    // `color="red"` loses to `props.color` at runtime, but a precomputed class
    // would beat it. Nothing to fold that keeps that order.
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = (props) => <styled.button color="red" {...props} padding="4px" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
}

#[test]
fn two_opaque_spreads_block_the_partial_fold() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = (props) => <styled.button {...props} {...rest} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
}

#[test]
fn a_non_identifier_opaque_spread_blocks_the_partial_fold() {
    // Re-reading `.className` off a call result would run it twice.
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = () => <styled.button {...getProps()} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
}

#[test]
fn an_existing_class_name_blocks_the_partial_fold() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = (props) => <styled.button {...props} className="mine" color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
}

#[test]
fn helper_cx_false_blocks_the_partial_fold() {
    use pandacss_project::HelperCxMode;

    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = (props) => <styled.button {...props} color="red" />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::False);

    assert!(!output.changed);
}

#[test]
fn partial_fold_uses_the_frameworks_class_attribute() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Btn = (props) => <styled.button {...props} color="red" />;
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { cx as __pcx } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    export const Btn = (props) => <styled.button {...props} class={__pcx('color_red', props?.class)} />;
    ");
}

#[test]
fn the_partial_fold_reads_the_spread_class_name_defensively() {
    // `{...props}` with a nullish value is a legal no-op in JSX, so reading
    // `.className` off it has to be optional or the element throws.
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const El = ({ ...props }) => <styled.div {...props} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(
        output.code.contains("props?.className"),
        "expected an optional read, got: {}",
        output.code
    );
}
