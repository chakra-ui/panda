//! Spreads, cross-file resolution, template-literal css, shorthands, and
//! conditional-spread parity with extractor / compiler fixtures.

use super::common::{
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
    @r#"export const cls = unk ? "color_red padding_1" : "color_red";"#
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
    @r#"export const cls = unk ? "color_red padding_1" : "color_red padding_2";"#
);

advanced_snapshot!(
    static_property_after_conditional_spread_wins_and_condition_still_runs,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ ...(recordAccess() ? { padding: '1' } : { padding: '2' }), padding: '0' });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = recordAccess() ? "padding_0" : "padding_0";"#
);

advanced_snapshot!(
    static_property_after_logical_spread_wins_and_condition_still_runs,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ ...(recordAccess() && { padding: '1' }), padding: '0' });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = recordAccess() ? "padding_0" : "padding_0";"#
);

advanced_snapshot!(
    interleaved_conditional_sites_keep_source_evaluation_order,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({
              color: first() ? 'red' : 'blue',
              ...(second() ? { padding: '1' } : { padding: '2' }),
            });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = (first() ? "color_red" : "color_blue") + " " + (second() ? "padding_1" : "padding_2");"#
);

#[test]
fn dynamic_property_after_conditional_spread_bails() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ ...(cond ? { padding: '1' } : { padding: '2' }), padding: getPadding() });
    "#};
    let output = transform("src/styles.tsx", source);

    assert!(!output.changed);
    assert!(output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn dynamic_property_before_static_duplicate_still_bails() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ padding: getPadding(), ...(cond ? { color: 'red' } : { color: 'blue' }), padding: '0' });
    "#};
    let output = transform("src/styles.tsx", source);

    assert!(!output.changed);
    assert!(output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn overlapping_conditional_spreads_bail() {
    for source in [
        "import { css } from '@panda/css';\nexport const cls = css({ ...(a ? { color: 'red' } : { color: 'blue' }), ...(b ? { color: 'green' } : { color: 'yellow' }) });\n",
        "import { css } from '@panda/css';\nexport const cls = css({ ...(a ? { color: 'red' } : { color: 'blue' }), ...(b && { color: 'green' }) });\n",
        "import { css } from '@panda/css';\nexport const cls = css({ _hover: { ...(a ? { color: 'red' } : { color: 'blue' }), ...(b ? { color: 'green' } : { color: 'yellow' }) } });\n",
        "import { css } from '@panda/css';\nexport const cls = css({ color: a ? 'red' : 'blue', ...(b ? { color: 'green' } : { color: 'yellow' }) });\n",
        "import { css } from '@panda/css';\nexport const cls = css({ _hover: { color: a ? 'red' : 'blue' }, ...(b ? { _hover: { padding: '1' } } : {}) });\n",
    ] {
        let output = transform("src/styles.tsx", source);
        assert!(!output.changed, "{}", output.code);
        assert!(output.bailed);
        assert_eq!(output.code, source);
    }
}

advanced_snapshot!(
    disjoint_conditional_spreads_still_lower,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ ...(a ? { color: 'red' } : { color: 'blue' }), ...(b && { padding: '1' }) });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = (a ? "color_red" : "color_blue") + " " + (b ? "padding_1" : "");"#
);

advanced_snapshot!(
    disjoint_conditional_spreads_remove_overridden_base_values,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({
              marginTop: '1',
              color: 'green',
              ...(a ? { color: 'red' } : { color: 'blue' }),
              ...(b ? { padding: '1' } : { padding: '2' }),
            });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = (a ? "color_red margin-top_1" : "color_blue margin-top_1") + " " + (b ? "margin-top_1 padding_1" : "margin-top_1 padding_2");"#
);

#[test]
fn opaque_object_members_keep_conditional_calls_unchanged() {
    for source in [
        "import { css } from '@panda/css';\nexport const cls = css({ ...getStyles(), ...(cond ? { color: 'red' } : { color: 'blue' }) });\n",
        "import { css } from '@panda/css';\nexport const cls = css({ [recordKey()]: 'value', ...(cond ? { color: 'red' } : { color: 'blue' }) });\n",
    ] {
        let output = transform("src/styles.tsx", source);
        assert!(!output.changed, "{}", output.code);
        assert!(output.bailed);
        assert_eq!(output.code, source);
    }
}

#[test]
fn statically_selected_spread_arm_keeps_nested_opaque_spreads() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({
          ...(true ? { ...getStyles(), ...(cond ? { color: 'red' } : { color: 'blue' }) } : {}),
        });
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(!output.changed);
    assert!(output.bailed);
    assert_snapshot!(output.code, @r#"
import { css } from '@panda/css';
export const cls = css({
  ...(true ? { ...getStyles(), ...(cond ? { color: 'red' } : { color: 'blue' }) } : {}),
});
"#);
}

advanced_snapshot!(
    statically_selected_spread_arm_lowers_nested_conditional_spread,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({
              ...(true ? { padding: '1', ...(cond ? { color: 'red' } : { color: 'blue' }) } : {}),
            });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = cond ? "color_red padding_1" : "color_blue padding_1";"#
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
    @r#"export const cls = unk ? "color_red padding_1" : "color_red margin-top_2";"#
);

advanced_snapshot!(
    ternary_spread_empty_alternate_emits_conditional,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ mx: 'auto', ...(fullWidth ? { maxW: 'none' } : {}) });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"export const cls = fullWidth ? "max-w_none mx_auto" : "mx_auto";"#
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

#[test]
fn helper_injection_does_not_panic_on_multibyte_source() {
    // The helper-usage byte scan must not slice inside a multibyte char (`«`).
    let source = indoc! {r"
        import { styled } from '@panda/jsx';
        // « guillemet comment »
        export const Box = styled.div`color: red;`;
    "};
    let output = transform_template_literal("src/box.tsx", source);

    assert!(output.changed);
    assert!(output.code.contains("__pcva"));
}

#[test]
fn folds_an_imported_scalar_value_and_reports_the_dependency() {
    let source = indoc! {r"
        import { brand } from './tokens';
        import { css } from '@panda/css';
        export const cls = css({ color: brand });
    "};
    let output = transform_cross_file(
        "main.tsx",
        source,
        &[("tokens.ts", "export const brand = 'red';\n")],
    );

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { brand } from './tokens';
    export const cls = "color_red";
    "#);
    // The imported file is a build dependency so the host re-transforms `main`
    // when `tokens.ts` changes.
    assert_eq!(output.dependencies, vec!["/proj/tokens.ts".to_owned()]);
}

#[test]
fn reports_no_dependencies_without_a_cross_file_import() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "};
    let output = transform_cross_file("main.tsx", source, &[]);

    assert!(output.changed);
    assert!(output.dependencies.is_empty());
}

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
    imported_conditional_spreads_emit_both_branch_classes,
    {
        let source = indoc! {r"
            import { colors } from './tokens';
            import { css } from '@panda/css';
            export const cls = css({ ...colors });
        "};
        transform_cross_file(
            "main.tsx",
            source,
            &[(
                "tokens.ts",
                "export const colors = { color: isDark ? 'red' : 'blue' };\n",
            )],
        )
    },
    @r#"
import { colors } from './tokens';
export const cls = "color_blue color_red";
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

advanced_snapshot!(
    tagged_template_nested_declaration_without_trailing_semicolon,
    {
        // The nested block's last declaration omits its `;` before `}`.
        let source = indoc! {r"
            import { css } from '@panda/css';
            export const cls = css`color: red; &:hover { color: blue }`;
        "};
        transform_template_literal("src/styles.tsx", source)
    },
    @r#"export const cls = "color_red [&:hover]:color_blue";"#
);

advanced_snapshot!(
    tagged_template_trailing_declaration_without_terminator,
    {
        // The final top-level declaration has no `;` at all.
        let source = indoc! {r"
            import { css } from '@panda/css';
            export const cls = css`color: red; background: blue`;
        "};
        transform_template_literal("src/styles.tsx", source)
    },
    @r#"export const cls = "background_blue color_red";"#
);

advanced_snapshot!(
    styled_template_definition_desugars_to_precomputed_cva,
    {
        let source = indoc! {r"
            import { styled } from '@panda/jsx';
            export const Box = styled.div`color: red;`;
        "};
        transform_template_literal("src/box.tsx", source)
    },
    @r#"
import { cva as __pcva } from '@pandacss-internal/css';
import { styled } from '@panda/jsx';
export const Box = styled.div(__pcva({ base: 'color_red' }));
"#
);

advanced_snapshot!(
    styled_template_definition_folds_nested_selectors_into_base,
    {
        let source = indoc! {r"
            import { styled } from '@panda/jsx';
            export const Box = styled.div`color: red; &:hover { color: blue }`;
        "};
        transform_template_literal("src/box.tsx", source)
    },
    @r#"
import { cva as __pcva } from '@pandacss-internal/css';
import { styled } from '@panda/jsx';
export const Box = styled.div(__pcva({ base: 'color_red [&:hover]:color_blue' }));
"#
);

advanced_snapshot!(
    styled_template_definition_with_dynamic_interpolation_is_left_untouched,
    unchanged,
    {
        // Panda template literals are static — an unsupported `${…}` interpolation
        // isn't extracted, so the definition is left for the runtime factory.
        let source = indoc! {r"
            import { styled } from '@panda/jsx';
            export const Box = styled.div`color: ${(p) => p.color};`;
        "};
        transform_template_literal("src/box.tsx", source)
    }
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

// --- || / ?? spreads bail when left is dynamic (Bug 2) ---

#[test]
fn logical_or_spread_with_dynamic_left_bails() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', ...(fallback || { padding: '1' }) });
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(!output.changed);
    assert!(output.bailed);
}

#[test]
fn logical_nullish_spread_with_dynamic_left_bails() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red', ...(fallback ?? { padding: '1' }) });
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(!output.changed);
    assert!(output.bailed);
}

// --- opaque spreads stay in source ---

#[test]
fn dynamic_identifier_spread_stays_unchanged() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ ...styles, color: 'red' });
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(!output.changed);
    assert!(output.bailed);
    assert_snapshot!(output.code, @r#"
import { css } from '@panda/css';
export const cls = css({ ...styles, color: 'red' });
"#);
}

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

advanced_snapshot!(
    dynamic_ident_conditional_spread_of_css_raw,
    {
        let source = indoc! {r#"
            import { css } from '@panda/css';
            const baseStyles = css.raw({ color: 'blue', padding: '8px' });
            export const cls = css({ ...(cond ? baseStyles : {}) });
        "#};
        transform("src/styles.tsx", source)
    },
    @r#"
const baseStyles = "color_blue padding_8px";
export const cls = cond ? "color_blue padding_8px" : "";
"#
);
