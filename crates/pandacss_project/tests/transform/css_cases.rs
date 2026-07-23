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
    css_raw_static_object,
    r#"
        import { css } from '@panda/css';
        export const raw = css.raw({ color: 'red', padding: '4px' });
    "#,
    true,
    @r#"export const raw = "color_red padding_4px";"#
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
