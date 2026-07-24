//! Edge-case coverage for nested condition blocks, finite conditionals, and bailouts.

use super::common::{
    transform, transform_jsx, transform_jsx_extended, transform_jsx_patterns,
    transform_jsx_recipes, transform_jsx_slot_recipes, transform_recipes,
};
use indoc::indoc;
use insta::assert_snapshot;

macro_rules! edge_snapshot {
    ($name:ident, $body:expr, @$snapshot:literal) => {
        #[test]
        fn $name() {
            let output = $body;
            assert!(output.changed, "bailed={}", output.bailed);
            assert!(!output.bailed, "unexpected bailout");
            assert_snapshot!(output.code, @$snapshot);
        }
    };
}

// --- nested condition combinations (JSX) ---

edge_snapshot!(
    jsx_dual_ternary_under_same_hover_block,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box _hover={{ color: a ? 'white' : 'black', bg: c ? 'gray' : 'white' }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={(a ? "hover:color_white" : "hover:color_black") + " " + (c ? "hover:bg_gray" : "hover:bg_white")} />
);
"#
);

edge_snapshot!(
    jsx_top_level_and_nested_conditional_on_same_element,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box
                color={a ? 'red' : 'blue'}
                _hover={{ _dark: { color: b ? 'white' : 'black' } }}
              />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={(a ? "color_red" : "color_blue") + " " + (b ? "hover:dark:color_white" : "hover:dark:color_black")} />
);
"#
);

edge_snapshot!(
    jsx_static_and_conditional_under_same_condition_key,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box
                _hover={{
                  color: 'blue',
                  _dark: { color: isDark ? 'white' : 'black' },
                }}
              />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isDark ? "hover:color_blue hover:dark:color_white" : "hover:color_blue hover:dark:color_black"} />
);
"#
);

edge_snapshot!(
    jsx_responsive_object_with_nested_hover_conditional,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box md={{ color: 'blue', _hover: { color: t ? 'white' : 'black' } }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={t ? "md:color_blue hover:md:color_white" : "md:color_blue hover:md:color_black"} />
);
"#
);

edge_snapshot!(
    jsx_property_level_base_and_nested_conditional,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box color={{ base: 'red', _hover: { md: isWide ? 'blue' : 'green' } }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isWide ? "color_red hover:md:color_blue" : "color_red hover:md:color_green"} />
);
"#
);

edge_snapshot!(
    jsx_peer_hover_nested_conditional,
    transform_jsx_extended(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box _peerHover={{ color: isActive ? 'red' : 'blue' }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isActive ? "peerHover:color_red" : "peerHover:color_blue"} />
);
"#
);

edge_snapshot!(
    jsx_group_hover_nested_conditional,
    transform_jsx_extended(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box _groupHover={{ _dark: { color: isDark ? 'white' : 'black' } }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isDark ? "groupHover:dark:color_white" : "groupHover:dark:color_black"} />
);
"#
);

// --- recipe / pattern variant conditionals ---

edge_snapshot!(
    jsx_recipe_single_variant_conditional,
    transform_jsx_recipes(
        "src/app.tsx",
        indoc! {r#"
            import { Button } from '@acme/ui';
            export const el = <Button size={isMobile ? 'sm' : 'lg'} />;
        "#},
    ),
    @r#"export const el = <div className={isMobile ? "button button--size_sm" : "button button--size_lg"} />;"#
);

edge_snapshot!(
    jsx_recipe_two_variant_conditionals,
    transform_jsx_recipes(
        "src/app.tsx",
        indoc! {r#"
            import { Button } from '@acme/ui';
            export const el = (
              <Button
                size={isMobile ? 'sm' : 'lg'}
                visual={isPrimary ? 'solid' : 'outline'}
              />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={(isMobile ? "button button--size_sm" : "button button--size_lg") + " " + (isPrimary ? "button button--size_md button--visual_solid" : "button button--size_md button--visual_outline")} />
);
"#
);

edge_snapshot!(
    jsx_slot_recipe_nested_conditional_style_prop,
    transform_jsx_slot_recipes(
        "src/app.tsx",
        indoc! {r#"
            import { Tabs } from '@acme/ui';
            export const el = (
              <Tabs.Trigger
                size="sm"
                _hover={{ _dark: { color: isDark ? 'white' : 'black' } }}
              />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isDark ? "hover:dark:color_white" : "hover:dark:color_black"} />
);
"#
);

// --- whole-arg object ternaries (css / recipe calls) ---

edge_snapshot!(
    css_whole_arg_object_ternary_with_nested_hover,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css(
              isPrimary
                ? { color: 'blue', _hover: { color: 'green' } }
                : { color: 'gray', _hover: { color: 'black' } },
            );
        "#},
    ),
    @r#"export const cls = isPrimary ? "color_blue hover:color_green" : "color_gray hover:color_black";"#
);

#[test]
fn recipe_whole_arg_object_ternary_stays_unchanged() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button(isMobile ? { size: 'sm' } : { size: 'lg' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn recipe_object_arg_finite_variant_ternary_emits_static_branches() {
    let source = indoc! {r#"
        import { button } from '@panda/recipes';
        export const cls = button({ size: isMobile ? 'sm' : 'lg' });
    "#};

    let output = transform_recipes("src/button.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const cls = "button button--size_sm";"#);
}

// --- css vs jsx semantic pair for the same nested conditional ---

edge_snapshot!(
    css_nested_ternary_emits_all_branch_classes,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { _dark: { color: isDark ? 'white' : 'black' } } });
        "#},
    ),
    @r#"export const cls = isDark ? "hover:dark:color_white" : "hover:dark:color_black";"#
);

edge_snapshot!(
    jsx_same_nested_ternary_emits_runtime_class_expression,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box _hover={{ _dark: { color: isDark ? 'white' : 'black' } }} />;
        "#},
    ),
    @r#"export const el = <div className={isDark ? "hover:dark:color_white" : "hover:dark:color_black"} />;"#
);

// --- bail / skip gallery (JSX) ---

#[test]
fn jsx_skips_logical_and_style_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color={isError && 'red'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_skips_nested_logical_or_spread_under_hover() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box _hover={{ ...(on || { color: 'red' }) }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_skips_logical_or_style_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color={props.color || 'blue'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_skips_clsx_in_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={clsx('a', cond && 'b')} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_skips_template_literal_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={`foo ${x}`} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_skips_logical_or_class_name_with_static_style() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className || 'default'} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_mixed_file_skips_bad_nested_sibling_keeps_good_element() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const ok = <Box _hover={{ _dark: { color: a ? 'white' : 'black' } }} />;
        export const bad = <Box _hover={{ _dark: { color: props.color } }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { Box } from '@panda/jsx';
    export const ok = <div className={a ? "hover:dark:color_white" : "hover:dark:color_black"} />;
    export const bad = <Box _hover={{ _dark: { color: props.color } }} />;
    "#
    );
}

#[test]
fn jsx_runtime_skips_logical_and_style_prop() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: isError && 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

// --- property-level && (Bug 1) ---

edge_snapshot!(
    css_property_logical_and_emits_conditional,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: isError && 'red' });
        "#},
    ),
    @r#"export const cls = isError ? "color_red" : "";"#
);

edge_snapshot!(
    css_property_logical_and_with_static_sibling,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: isError && 'red', padding: '4px' });
        "#},
    ),
    @r#"export const cls = isError ? "color_red padding_4px" : "padding_4px";"#
);

edge_snapshot!(
    css_property_logical_and_under_hover,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { color: isError && 'red' } });
        "#},
    ),
    @r#"export const cls = isError ? "hover:color_red" : "";"#
);

edge_snapshot!(
    jsx_property_logical_and_under_hover,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box color="blue" _hover={{ color: isError && 'red' }} />;
        "#},
    ),
    @r#"export const el = <div className={isError ? "color_blue hover:color_red" : "color_blue"} />;"#
);

edge_snapshot!(
    jsx_property_logical_and_under_hover_only,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box _hover={{ color: isError && 'red' }} />;
        "#},
    ),
    @r#"export const el = <div className={isError ? "hover:color_red" : ""} />;"#
);

// --- nested conditional spreads under condition blocks (Bug 3) ---

edge_snapshot!(
    css_nested_ternary_spread_under_hover,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { ...(on ? { color: 'red' } : {}) } });
        "#},
    ),
    @r#"export const cls = on ? "hover:color_red" : "";"#
);

edge_snapshot!(
    css_nested_logical_and_spread_under_hover,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { ...(on && { color: 'red' }) } });
        "#},
    ),
    @r#"export const cls = on ? "hover:color_red" : "";"#
);

edge_snapshot!(
    jsx_nested_ternary_spread_under_hover,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box _hover={{ ...(on ? { color: 'red' } : {}) }} />;
        "#},
    ),
    @r#"export const el = <div className={on ? "hover:color_red" : ""} />;"#
);

edge_snapshot!(
    jsx_nested_logical_and_spread_under_hover,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box _hover={{ ...(on && { color: 'red' }) }} />;
        "#},
    ),
    @r#"export const el = <div className={on ? "hover:color_red" : ""} />;"#
);

edge_snapshot!(
    jsx_nested_ternary_spread_under_hover_with_static_sibling,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box color="blue" _hover={{ padding: '4px', ...(on ? { color: 'red' } : {}) }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={on ? "color_blue hover:color_red hover:padding_4px" : "color_blue hover:padding_4px"} />
);
"#
);

edge_snapshot!(
    css_nested_ternary_spread_under_hover_with_static_sibling,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ _hover: { padding: '4px', ...(on ? { color: 'red' } : {}) } });
        "#},
    ),
    @r#"export const cls = on ? "hover:color_red hover:padding_4px" : "hover:padding_4px";"#
);

edge_snapshot!(
    css_multi_prop_finite_ternary_with_nested_hover,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({
              color: isError ? 'red' : 'blue',
              _hover: { color: isDark ? 'white' : 'black' },
            });
        "#},
    ),
    @r#"export const cls = (isError ? "color_red" : "color_blue") + " " + (isDark ? "hover:color_white" : "hover:color_black");"#
);

edge_snapshot!(
    jsx_pattern_nested_conditional_style_prop,
    transform_jsx_patterns(
        "src/app.tsx",
        indoc! {r#"
            import { Stack } from '@panda/jsx';
            export const el = (
              <Stack
                gap={isCompact ? '2' : '4'}
                _hover={{ color: isDark ? 'white' : 'black' }}
              />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={(isCompact ? "gap_2" : "gap_4") + " " + (isDark ? "hover:color_white" : "hover:color_black")} />
);
"#
);

edge_snapshot!(
    jsx_parenthesized_condition_in_ternary_still_rewrites,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box color={(isReady && isError) ? 'red' : 'blue'} />;
        "#},
    ),
    @r#"export const el = <div className={(isReady && isError) ? "color_red" : "color_blue"} />;"#
);

// --- responsive array under nested block (css static model) ---

edge_snapshot!(
    css_nested_responsive_array_under_condition,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({
              _hover: { _dark: { color: ['pink.100', 'pink.200'] } },
            });
        "#},
    ),
    @r#"export const cls = "hover:dark:color_pink.100 hover:dark:sm:color_pink.200";"#
);

#[test]
fn styled_call_syntax_rewrites_config_to_string_branch_cva() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Card = styled('div', { color: 'red' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert_snapshot!(output.code, @r"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    export const Card = styled('div', __pcva({ base: 'color_red' }));
    ");
}

#[test]
fn styled_member_call_rewrites_style_object_to_string_branch_cva() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Card = styled.div({ color: 'red' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert_snapshot!(output.code, @r"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    export const Card = styled.div(__pcva({ base: 'color_red' }));
    ");
}

// --- nested ternaries (property-level, not unioned false branch) ---

edge_snapshot!(
    css_nested_ternary_property_preserves_structure,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: isDark ? 'red' : isPrimary ? 'blue' : 'green' });
        "#},
    ),
    @r#"export const cls = isDark ? "color_red" : isPrimary ? "color_blue" : "color_green";"#
);

edge_snapshot!(
    jsx_nested_ternary_property_preserves_structure,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box color={isDark ? 'red' : isPrimary ? 'blue' : 'green'} />;
        "#},
    ),
    @r#"export const el = <div className={isDark ? "color_red" : isPrimary ? "color_blue" : "color_green"} />;"#
);

edge_snapshot!(
    css_object_valued_ternary_branches,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ color: isDark ? { base: 'white', _hover: 'gray' } : { base: 'black' } });
        "#},
    ),
    @r#"export const cls = isDark ? "color_white hover:color_gray" : "color_black";"#
);

edge_snapshot!(
    css_opacity_zero_branch_emits_both_arms,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ opacity: isHovered ? 1 : 0 });
        "#},
    ),
    @r#"export const cls = isHovered ? "opacity_1" : "opacity_0";"#
);

#[test]
fn css_property_dynamic_logical_or_bails() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: maybeColor || 'gray' });
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn css_unparseable_ternary_branch_bails() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: dark ? maybeFn() : 'black' });
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(!output.changed);
    assert_eq!(output.code, source);
}

edge_snapshot!(
    css_spread_wins_over_static_same_key,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ padding: '0', ...(unk ? { padding: '1' } : { padding: '2' }) });
        "#},
    ),
    @r#"export const cls = unk ? "padding_1" : "padding_2";"#
);

// --- StyleTree extensions ---

edge_snapshot!(
    css_responsive_array_slot_ternary,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ padding: [isWide ? '8px' : '4px', '16px'] });
        "#},
    ),
    @r#"export const cls = isWide ? "padding_8px sm:padding_16px" : "padding_4px sm:padding_16px";"#
);

edge_snapshot!(
    css_raw_ident_ternary_spread_both_arms,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            const primary = css.raw({ color: 'red', padding: '8px' });
            const secondary = css.raw({ color: 'blue', padding: '4px' });
            export const cls = css({ ...(isActive ? primary : secondary) });
        "#},
    ),
    @r#"
const primary = "color_red padding_8px";
const secondary = "color_blue padding_4px";
export const cls = isActive ? "color_red padding_8px" : "color_blue padding_4px";
"#
);

edge_snapshot!(
    css_nested_const_object_spread_preserves_conditionals,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            const styles = {
              _hover: {
                ...(isActive ? { color: 'red' } : { color: 'blue' }),
              },
            };
            export const cls = css({ ...styles });
        "#},
    ),
    @r#"
const styles = {
  _hover: {
    ...(isActive ? { color: 'red' } : { color: 'blue' }),
  },
};
export const cls = isActive ? "hover:color_red" : "hover:color_blue";
"#
);

edge_snapshot!(
    jsx_css_prop_conditional_keeps_static_sibling,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box css={{ color: isDark ? 'white' : 'black', marginTop: '4px' }} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isDark ? "color_white margin-top_4px" : "color_black margin-top_4px"} />
);
"#
);

edge_snapshot!(
    jsx_sprinkles_object_or_string_ternary,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box color={isDark ? { base: 'white', _hover: 'gray' } : 'black'} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isDark ? "color_white hover:color_gray" : "color_black"} />
);
"#
);

// --- v1 kitchen-sink (parser output / css.raw edge cases) ---

edge_snapshot!(
    jsx_array_whole_arm_ternary,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = <Box padding={hasIcon ? ['0'] : ['4']} />;
        "#},
    ),
    @r#"export const el = <div className={hasIcon ? "padding_0" : "padding_4"} />;"#
);

edge_snapshot!(
    jsx_array_mid_slot_ternary,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box padding={[2, verticallyCondensed ? 2 : 3, 4]} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={verticallyCondensed ? "padding_2 md:padding_4 sm:padding_2" : "padding_2 md:padding_4 sm:padding_3"} />
);
"#
);

edge_snapshot!(
    css_array_mid_slot_ternary,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            export const cls = css({ padding: [2, condensed ? 2 : 3, 4] });
        "#},
    ),
    @r#"export const cls = condensed ? "padding_2 md:padding_4 sm:padding_2" : "padding_2 md:padding_4 sm:padding_3";"#
);

edge_snapshot!(
    css_member_hop_preserves_nested_conditional,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            const styles = {
              hover: {
                color: isActive ? 'red' : 'blue',
              },
            };
            export const cls = css({ ...styles.hover });
        "#},
    ),
    @r#"
const styles = {
  hover: {
    color: isActive ? 'red' : 'blue',
  },
};
export const cls = isActive ? "color_red" : "color_blue";
"#
);

edge_snapshot!(
    css_nested_member_under_condition_key,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            const styles = {
              hover: {
                ...(isActive ? { color: 'red' } : { color: 'blue' }),
              },
            };
            export const cls = css({ _hover: styles.hover });
        "#},
    ),
    @r#"
const styles = {
  hover: {
    ...(isActive ? { color: 'red' } : { color: 'blue' }),
  },
};
export const cls = isActive ? "hover:color_red" : "hover:color_blue";
"#
);

edge_snapshot!(
    css_raw_ab_with_static_siblings_and_nested_hover,
    transform(
        "src/styles.tsx",
        indoc! {r#"
            import { css } from '@panda/css';
            const primary = css.raw({ backgroundColor: 'blue', color: 'white' });
            const secondary = css.raw({ backgroundColor: 'gray', color: 'black' });
            export const cls = css({
              padding: '8px',
              ...(variant === 'primary' ? primary : secondary),
              _hover: {
                ...(variant === 'primary' ? primary : {}),
                opacity: 0.9,
              },
            });
        "#},
    ),
    @r#"
const primary = "background-color_blue color_white";
const secondary = "background-color_gray color_black";
export const cls = (variant === 'primary' ? "background-color_blue color_white padding_8px hover:opacity_0.9" : "background-color_gray color_black padding_8px hover:opacity_0.9") + " " + (variant === 'primary' ? "padding_8px hover:background-color_blue hover:color_white hover:opacity_0.9" : "padding_8px hover:opacity_0.9");
"#
);

edge_snapshot!(
    jsx_sprinkles_responsive_object_ternary,
    transform_jsx(
        "src/app.tsx",
        indoc! {r#"
            import { Box } from '@panda/jsx';
            export const el = (
              <Box color={isShown ? { base: 'white', md: 'gray' } : 'black'} />
            );
        "#},
    ),
    @r#"
export const el = (
  <div className={isShown ? "color_white md:color_gray" : "color_black"} />
);
"#
);
