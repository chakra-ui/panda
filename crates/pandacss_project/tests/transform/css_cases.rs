//! Static css() transform cases ported from extractor/compiler parity fixtures.

use super::common::transform;
use indoc::indoc;
use insta::assert_snapshot;

macro_rules! transform_snapshot {
    ($name:ident, $source:expr, $changed:expr) => {
        #[test]
        fn $name() {
            let source = indoc! { $source };
            let output = transform("src/styles.tsx", source);
            assert_eq!(output.changed, $changed);
            if $changed {
                assert_snapshot!(output.code, @$source);
            } else {
                assert_eq!(output.code, source);
            }
        }
    };
    ($name:ident, $source:expr, $changed:expr, @$snapshot:literal) => {
        #[test]
        fn $name() {
            let source = indoc! { $source };
            let output = transform("src/styles.tsx", source);
            assert_eq!(output.changed, $changed);
            assert_snapshot!(output.code, @$snapshot);
        }
    };
}

transform_snapshot!(
    literal_string_color,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#,
    true,
    @r#"export const cls = "color_red";"#
);

transform_snapshot!(
    duplicate_object_keys_last_value_wins,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', padding: '4px', color: 'blue' });
    "#,
    true,
    @r#"export const cls = "color_blue padding_4px";"#
);

transform_snapshot!(
    spread_overwrite_keeps_spread_position,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ ...{ color: 'red', padding: '4px' }, color: 'blue' });
    "#,
    true,
    @r#"export const cls = "color_blue padding_4px";"#
);

transform_snapshot!(
    merge_two_inline_object_spreads,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ ...{ color: 'red', padding: '4px' }, ...{ color: 'blue', marginTop: '8px' } });
    "#,
    true,
    @r#"export const cls = "color_blue margin-top_8px padding_4px";"#
);

transform_snapshot!(
    string_whitespace_collapsed_outside_quotes,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ display: '  flex  ', padding: '4px' });
    "#,
    true,
    @r#"export const cls = "d_flex padding_4px";"#
);

transform_snapshot!(
    aliased_css_import,
    r#"
        import { css as styledCss } from '@panda/css';
        export const cls = styledCss({ color: 'red' });
    "#,
    true,
    @r#"export const cls = "color_red";"#
);

transform_snapshot!(
    css_raw_static_object_unwraps_to_the_object,
    r#"
        import { css } from '@panda/css';
        export const raw = css.raw({ color: 'red', padding: '4px' });
    "#,
    true,
    @"export const raw = { color: 'red', padding: '4px' };"
);

transform_snapshot!(
    multi_arg_string_then_object,
    r#"
        import { css } from '@panda/css';
        export const cls = css('ignored-layer', { color: 'red' });
    "#,
    true,
    @r#"export const cls = "color_red";"#
);

transform_snapshot!(
    array_of_style_objects,
    r#"
        import { css } from '@panda/css';
        export const cls = css([{ color: 'red' }, { padding: '4px' }]);
    "#,
    true,
    @r#"export const cls = "color_red padding_4px";"#
);

transform_snapshot!(
    array_skips_null_and_false_entries,
    r#"
        import { css } from '@panda/css';
        export const cls = css([null, false, { color: 'red' }]);
    "#,
    true,
    @r#"export const cls = "color_red";"#
);

transform_snapshot!(
    foldable_const_ternary,
    r#"
        import { css } from '@panda/css';
        const dark = true;
        export const cls = css({ color: dark ? 'red' : 'blue' });
    "#,
    true,
    @r#"
const dark = true;
export const cls = "color_red";
"#
);

transform_snapshot!(
    template_literal_in_object,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ padding: `4px` });
    "#,
    true,
    @r#"export const cls = "padding_4px";"#
);

transform_snapshot!(
    empty_object_arg_is_left_unchanged,
    r#"
        import { css } from '@panda/css';
        export const cls = css({});
    "#,
    false
);

transform_snapshot!(
    no_args_call_is_left_unchanged,
    r#"
        import { css } from '@panda/css';
        export const cls = css();
    "#,
    false
);

transform_snapshot!(
    dynamic_spread_bails,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ ...styles, color: 'red' });
    "#,
    false
);

transform_snapshot!(
    dynamic_template_interpolation_bails,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: `${dynamic}px` });
    "#,
    false
);

transform_snapshot!(
    logical_or_in_value_bails,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' || 'blue' });
    "#,
    true,
    @r#"export const cls = "color_red";"#
);

transform_snapshot!(
    pseudo_property_rewrites_to_condition_prefixed_class,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { color: 'red' } });
    "#,
    true,
    @r#"export const cls = "hover:color_red";"#
);

#[test]
fn escapes_class_names_containing_quotes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ content: '"x"' });
    "#};

    let output = transform("src/styles.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "content_\"x\"";"#);
}

#[test]
fn raw_member_text_inside_a_value_does_not_change_call_classification() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ content: '.raw(' });
    "#};

    let output = transform("src/styles.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const cls = "content_.raw(";"#);
}

// A `.raw()` call folds to a bare object literal, which needs parentheses
// wherever `{` would start a block instead of an expression.

#[test]
fn raw_in_a_concise_arrow_body_is_parenthesized() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const make = () => css.raw({ color: 'red' });
    "#};
    assert_snapshot!(transform("src/styles.tsx", source).code, @"export const make = () => ({ color: 'red' });");
}

#[test]
fn raw_in_statement_position_without_semicolons_is_parenthesized() {
    // ASI: the previous line ends without `;`, so a bare `{` here would parse
    // as a block, not an object.
    let source = indoc! {r#"
        import { css } from '@panda/css'
        const first = 1
        css.raw({ color: 'red' })
    "#};
    let output = transform("src/styles.tsx", source);
    assert_snapshot!(output.code, @r"
    const first = 1
    ({ color: 'red' })
    ");
}

#[test]
fn raw_after_return_keeps_the_object_bare() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export function make() {
          return css.raw({ color: 'red' });
        }
    "#};
    assert_snapshot!(transform("src/styles.tsx", source).code, @r"
    export function make() {
      return { color: 'red' };
    }
    ");
}

#[test]
fn raw_as_a_call_argument_keeps_the_object_bare() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css(css.raw({ color: 'red' }), { color: 'blue' });
    "#};
    // the whole call folds, so the object never reaches the output
    assert_snapshot!(transform("src/styles.tsx", source).code, @r#"export const cls = "color_blue";"#);
}

#[test]
fn raw_as_an_object_property_value_keeps_the_object_bare() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const styles = { button: css.raw({ color: 'red' }) };
    "#};
    assert_snapshot!(transform("src/styles.tsx", source).code, @"export const styles = { button: { color: 'red' } };");
}

// --- `css.fallback()` ---

#[test]
fn a_static_fallback_run_rewrites_to_its_class() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const a = css({ width: css.fallback('min(60rem, 100%)', '75%') });
    "#};

    let output = transform("src/styles.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const a = "width_fallback(min(60rem,_100%),_75%)";"#);
}

#[test]
fn a_dynamic_fallback_member_keeps_the_runtime_call() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const a = (enhanced) => css({ width: css.fallback(enhanced, '75%') });
    "#};

    let output = transform("src/styles.tsx", source);

    assert_eq!(output.code, source);
}

#[test]
fn a_nested_fallback_run_rewrites_to_its_classes() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const a = css({
          _hover: { color: css.fallback('oklch(60% 0.2 30)', 'red') },
          width: [css.fallback('min(60rem, 100%)', '100%'), '75%'],
        });
    "#};

    let output = transform("src/styles.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const a = "width_fallback(min(60rem,_100%),_100%) hover:color_fallback(oklch(60%_0.2_30),_red) sm:width_75%";"#);
}
