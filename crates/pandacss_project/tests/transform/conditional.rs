//! Conditional / nested CSS transform parity — scenarios from encoder, project,
//! compiler runtime-parity, and sandbox codegen fixtures.

use super::common::transform;
use indoc::indoc;
use insta::assert_snapshot;

macro_rules! conditional_snapshot {
    ($name:ident, $source:expr, $changed:expr, @$snapshot:literal) => {
        #[test]
        fn $name() {
            let source = indoc! { $source };
            let output = transform("src/styles.tsx", source);
            assert_eq!(output.changed, $changed, "bailed={}", output.bailed);
            assert!(!output.bailed, "unexpected bailout");
            assert_snapshot!(output.code, @$snapshot);
        }
    };
    ($name:ident, $source:expr, unchanged) => {
        #[test]
        fn $name() {
            let source = indoc! { $source };
            let output = transform("src/styles.tsx", source);
            assert!(!output.changed);
            assert!(!output.bailed);
            assert_eq!(output.code, source);
        }
    };
}

// --- object-level conditions (_hover, _dark, sm) ---

conditional_snapshot!(
    condition_block_hover_color,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { color: 'red' } });
    "#,
    true,
    @r#"export const cls = "hover:color_red";"#
);

conditional_snapshot!(
    nested_condition_block_hover_dark,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { _dark: { color: 'pink' } } });
    "#,
    true,
    @r#"export const cls = "hover:dark:color_pink";"#
);

conditional_snapshot!(
    breakpoint_block_applies_to_nested_props,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ sm: { color: 'purple', padding: '4px' } });
    "#,
    true,
    @r#"export const cls = "sm:color_purple sm:padding_4px";"#
);

conditional_snapshot!(
    mixed_base_and_nested_condition_blocks,
    r#"
        import { css } from '@panda/css';
        export const cls = css({
            color: 'red',
            _hover: { color: 'blue', md: { color: 'green' } },
        });
    "#,
    true,
    @r#"export const cls = "color_red hover:color_blue hover:md:color_green";"#
);

// --- property-level conditions (color: { _hover: … }) ---

conditional_snapshot!(
    property_level_hover_condition,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { _hover: 'red' } });
    "#,
    true,
    @r#"export const cls = "hover:color_red";"#
);

conditional_snapshot!(
    property_level_base_hover_and_breakpoint,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { base: 'red', _hover: 'blue', md: 'green' } });
    "#,
    true,
    @r#"export const cls = "color_red hover:color_blue md:color_green";"#
);

conditional_snapshot!(
    property_level_deeply_nested_conditions,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { _hover: { md: 'blue' } } });
    "#,
    true,
    @r#"export const cls = "hover:md:color_blue";"#
);

conditional_snapshot!(
    property_level_long_condition_chain,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { _hover: { md: { lg: { xl: 'red' } } } } });
    "#,
    true,
    @r#"export const cls = "hover:md:lg:xl:color_red";"#
);

conditional_snapshot!(
    property_level_responsive_object,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { base: 'red', md: 'blue' } });
    "#,
    true,
    @r#"export const cls = "color_red md:color_blue";"#
);

conditional_snapshot!(
    property_level_nested_responsive_keys,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { sm: { md: 'blue' } } });
    "#,
    true,
    @r#"export const cls = "sm:md:color_blue";"#
);

// --- responsive arrays ---

conditional_snapshot!(
    responsive_array_skips_null_slots,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: ['red', 'blue', null, 'green'] });
    "#,
    true,
    @r#"export const cls = "color_red lg:color_green sm:color_blue";"#
);

conditional_snapshot!(
    responsive_array_skips_null_and_undefined,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ background: ['cyan.100', 'cyan.200', null, undefined, 'cyan.300'] });
    "#,
    true,
    @r#"export const cls = "background_cyan.100 sm:background_cyan.200 xl:background_cyan.300";"#
);

conditional_snapshot!(
    nested_condition_with_responsive_array,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { _dark: { color: ['pink.100', 'pink.200'] } } });
    "#,
    true,
    @r#"export const cls = "hover:dark:color_pink.100 hover:dark:sm:color_pink.200";"#
);

// --- raw selectors & at-rules (encoder raw_selector_and_at_rule_keys) ---

conditional_snapshot!(
    arbitrary_selector_key,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ ['&:data-panda']: { display: 'flex' } });
    "#,
    true,
    @r#"export const cls = "[&:data-panda]:d_flex";"#
);

conditional_snapshot!(
    raw_selector_and_at_rule_chain,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { '&:hover': { '@media (hover: hover)': 'red' } } });
    "#,
    true,
    @r#"export const cls = "[@media_(hover:_hover)]:[&:hover]:color_red";"#
);

// --- important + whitespace under conditions (runtime-parity) ---

conditional_snapshot!(
    important_with_condition_prefixes,
    r#"
        import { css } from '@panda/css';
        export const cls = css({
            zIndex: '1002 !important',
            _hover: { color: 'red.500 !important' },
        });
    "#,
    true,
    @r#"export const cls = "z_1002! hover:color_red.500!";"#
);

conditional_snapshot!(
    important_under_property_level_hover,
    r#"
        import { css } from '@panda/css';
        export const cls = css({
            color: 'red',
            _hover: { borderColor: 'green !IMPORTANT' },
        });
    "#,
    true,
    @r#"export const cls = "color_red hover:border-color_green!";"#
);

conditional_snapshot!(
    conditional_whitespace_collapses_in_value,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { margin: '1rem\t2rem' } });
    "#,
    true,
    @r#"export const cls = "hover:margin_1rem_2rem";"#
);

// --- multi-arg merge (css.test merging styles) ---

conditional_snapshot!(
    merge_args_last_write_wins_for_same_hover_color,
    r#"
        import { css } from '@panda/css';
        export const cls = css(
            { fontSize: 'sm', _hover: { color: 'green.100' } },
            { _hover: { color: 'green.200' } },
        );
    "#,
    true,
    @r#"export const cls = "fs_sm hover:color_green.200";"#
);

conditional_snapshot!(
    merge_args_responsive_font_size,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ fontSize: 'md' }, { fontSize: { base: 'lg', sm: 'xs' } });
    "#,
    true,
    @r#"export const cls = "fs_lg sm:fs_xs";"#
);

conditional_snapshot!(
    merge_args_array_items_flatten,
    r#"
        import { css } from '@panda/css';
        export const cls = css(
            { fontSize: 'sm', backgroundColor: 'red.500' },
            [{ backgroundColor: 'red.600' }, { fontSize: '12px' }],
        );
    "#,
    true,
    @r#"export const cls = "background-color_red.600 fs_12px";"#
);

conditional_snapshot!(
    css_raw_rewrites_conditional_object,
    r#"
        import { css } from '@panda/css';
        export const cls = css.raw({ color: { base: 'red', md: 'blue' } });
    "#,
    true,
    @r#"export const cls = "color_red md:color_blue";"#
);

conditional_snapshot!(
    nested_condition_block_with_finite_ternary,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hover: { _dark: { color: isDark ? 'white' : 'black' } } });
    "#,
    true,
    @r#"export const cls = isDark ? "hover:dark:color_white" : "hover:dark:color_black";"#
);

conditional_snapshot!(
    property_level_nested_condition_with_finite_ternary,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { _hover: { md: isWide ? 'blue' : 'green' } } });
    "#,
    true,
    @r#"export const cls = isWide ? "hover:md:color_blue" : "hover:md:color_green";"#
);

// --- unresolved condition keys (encoder emits nothing) ---

conditional_snapshot!(
    unresolved_typo_condition_block,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ _hovr: { color: 'red' } });
    "#,
    unchanged
);

conditional_snapshot!(
    unresolved_typo_under_property,
    r#"
        import { css } from '@panda/css';
        export const cls = css({ color: { _hovr: 'red' } });
    "#,
    unchanged
);
