//! Edge-case coverage for nested condition blocks, finite conditionals, and bailouts.

use crate::common::{
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
  <div className={isDark ? "hover:dark:color_white" : "hover:dark:color_black"} />
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
  <div className={t ? "hover:md:color_white" : "hover:md:color_black"} />
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
  <div className={isWide ? "hover:md:color_blue" : "hover:md:color_green"} />
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
            import { Button } from '@panda/jsx';
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
            import { Button } from '@panda/jsx';
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
            import { Tabs } from '@panda/jsx';
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
    assert_snapshot!(output.code, @r#"
    import { button } from '@panda/recipes';
    export const cls = "button button--size_sm";
    "#
    );
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
