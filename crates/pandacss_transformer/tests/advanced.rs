//! Spreads, cross-file resolution, template-literal css, shorthands, and
//! conditional-spread parity with extractor / compiler fixtures.

use crate::common::{
    transform, transform_cross_file, transform_template_literal, transform_with_shorthands,
};
use indoc::indoc;
use insta::assert_snapshot;

macro_rules! advanced_snapshot {
    ($name:ident, $body:expr, @$snapshot:literal) => {
        #[test]
        fn $name() {
            let output = $body;
            assert!(output.changed, "bailed={}", output.bailed);
            assert!(!output.bailed);
            assert_snapshot!(output.code, @$snapshot);
        }
    };
    ($name:ident, unchanged, $body:expr) => {
        #[test]
        fn $name() {
            let output = $body;
            assert!(!output.changed);
            assert!(!output.bailed);
        }
    };
}

// --- css.raw identifier spreads (raw_spreads.rs) ---

advanced_snapshot!(
    css_raw_spread_merges_into_call,
    {
        let source = indoc! {r"
            import { css } from '@panda/css';
            const baseStyles = css.raw({ color: 'red', padding: '8px' });
            export const cls = css({ ...baseStyles, marginTop: '4px' });
        "};
        transform("src/styles.tsx", source)
    },
    @r#"
const baseStyles = "color_red padding_8px";
export const cls = "color_red margin-top_4px padding_8px";
"#
);

advanced_snapshot!(
    css_raw_spread_under_hover_with_focus_selector,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            const baseStyles = css.raw({ padding: '10px' });
            export const cls = css({
                ...baseStyles,
                _hover: {
                    ...baseStyles,
                    "&:focus": {
                        ...baseStyles,
                        outline: '2px solid blue',
                    },
                },
            });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"
const baseStyles = "padding_10px";
export const cls = "padding_10px hover:padding_10px hover:[&:focus]:outline_2px_solid_blue hover:[&:focus]:padding_10px";
"#
);

advanced_snapshot!(
    foldable_conditional_spread_of_css_raw,
    {
        let source = indoc! {r"
            import { css } from '@panda/css';
            const baseStyles = css.raw({ color: 'blue', padding: '8px' });
            const isActive = true;
            export const cls = css({
                ...(isActive ? baseStyles : {}),
                _hover: {
                    ...(isActive && baseStyles),
                    opacity: 0.9,
                },
            });
        "};
        transform("src/styles.tsx", source)
    },
    @r#"
const baseStyles = "color_blue padding_8px";
const isActive = true;
export const cls = "color_blue padding_8px hover:color_blue hover:opacity_0.9 hover:padding_8px";
"#
);

// --- conditional spreads (conditional_output.rs) ---

advanced_snapshot!(
    logical_and_spread_merges_padding,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: 'red', ...(unk && { padding: '1' }) });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red padding_1";"#
);

advanced_snapshot!(
    ternary_spread_same_key_emits_all_padding_branches,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: 'red', ...(unk ? { padding: '1' } : { padding: '2' }) });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red padding_1 padding_2";"#
);

advanced_snapshot!(
    ternary_spread_distinct_keys_merge_both_branches,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: 'red', ...(unk ? { padding: '1' } : { marginTop: '2' }) });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red margin-top_2 padding_1";"#
);

advanced_snapshot!(
    conditional_value_under_hover_emits_both_colors,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { color: unk ? 'red' : 'blue' } });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = unk ? "hover:color_red" : "hover:color_blue";"#
);

// --- cross-file spreads under conditions (cross_file.rs) ---

advanced_snapshot!(
    imported_object_spreads_under_hover,
    {
        let source = indoc! {r"
            import { hover } from './styles';
            import { css } from '@panda/css';
            export const cls = css({ _hover: { ...hover, backgroundColor: 'blue' } });
        "};
        transform_cross_file(
            "main.tsx",
            source,
            &[("styles.ts", "export const hover = { color: 'red' };\n")],
        )
    },
    @r#"
import { hover } from './styles';
export const cls = "hover:background-color_blue hover:color_red";
"#
);

advanced_snapshot!(
    imported_css_raw_spreads_into_call,
    {
        let source = indoc! {r"
            import { button } from './styles';
            import { css } from '@panda/css';
            export const cls = css({ ...button, marginTop: '8px' });
        "};
        transform_cross_file(
            "main.tsx",
            source,
            &[(
                "styles.ts",
                indoc! {r"
                    import { css } from '@panda/css';
                    export const button = css.raw({ color: 'red', padding: '4px' });
                "},
            )],
        )
    },
    @r#"
import { button } from './styles';
export const cls = "color_red margin-top_8px padding_4px";
"#
);

// --- template-literal css (css_template.rs) ---

advanced_snapshot!(
    tagged_template_with_media_query,
    {
        let source = indoc! {r"
            import { css } from '@panda/css';
            export const cls = css`
              color: red;
              @media (min-width: 700px) {
                background: blue;
              }
            `;
        "};
        transform_template_literal("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red [@media_(min-width:_700px)]:background_blue";"#
);

advanced_snapshot!(
    tagged_template_with_nested_selector,
    {
        let source = indoc! {r"
            import { css } from '@panda/css';
            export const cls = css`
              color: red;
              p {
                color: blue;
              }
            `;
        "};
        transform_template_literal("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red [&_p]:color_blue";"#
);

advanced_snapshot!(
    tagged_template_hover_pseudo,
    {
        let source = indoc! {r"
            import { css } from '@panda/css';
            export const cls = css`
              color: red;
              &:hover {
                color: blue;
              }
            `;
        "};
        transform_template_literal("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red [&:hover]:color_blue";"#
);

// --- preset-style shorthands (project.test / css.test) ---

advanced_snapshot!(
    utility_and_shorthand_props_resolve,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: 'red', bg: 'blue' });
        "#};
        transform_with_shorthands("src/styles.tsx", source)
    },
    @r#"export const cls = "bg-c_blue c_red";"#
);

advanced_snapshot!(
    shorthand_with_object_condition,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ bg: { _hover: 'yellow.100' } });
        "#};
        transform_with_shorthands("src/styles.tsx", source)
    },
    @r#"export const cls = "hover:bg-c_yellow.100";"#
);

advanced_snapshot!(
    shorthand_hover_block,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { bg: 'yellow.200' } });
        "#};
        transform_with_shorthands("src/styles.tsx", source)
    },
    @r#"export const cls = "hover:bg-c_yellow.200";"#
);

// --- still skips unresolved identifier spreads ---

advanced_snapshot!(dynamic_identifier_spread_stays_unchanged, unchanged, {
    let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ ...styles, color: 'red' });
        "#};
    transform("src/styles.tsx", source)
});

advanced_snapshot!(
    deeply_nested_hover_dark_conditional_css_emits_both_branches,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { _dark: { color: isDark ? 'white' : 'black' } } });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = isDark ? "hover:dark:color_white" : "hover:dark:color_black";"#
);
