use super::common::{
    project_with_jsx, transform_jsx, transform_jsx_patterns, transform_jsx_qwik,
    transform_jsx_recipes, transform_jsx_solid, transform_jsx_with_project, transform_panda_jsx,
    transform_panda_jsx_patterns, transform_with_project,
};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn does_not_corrupt_output_when_a_css_call_is_nested_in_a_rewritten_element() {
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" data-x={css({ color: 'blue' })} />;
    "#};

    let output = transform_with_project(&project_with_jsx(), "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { css } from '@panda/css';
    export const el = <div data-x={css({ color: 'blue' })} className="color_red" />;
    "#);
}

#[test]
fn rewrites_the_matching_closing_tag_for_nested_same_name_elements() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red"><Box>inner</Box></Box>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { Box } from '@panda/jsx';
    export const el = <div className="color_red"><Box>inner</Box></div>;
    "#);
}

#[test]
fn handles_a_brace_inside_an_attribute_string_value() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box json={'}'} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div json={'}'} className="color_red" />;"#);
}

#[test]
fn does_not_match_a_closing_tag_inside_a_string_child() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red">{"</Box>"}</Box>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_red">{"</Box>"}</div>;"#);
}

#[test]
fn rewrites_box_to_intrinsic_with_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_red" />;"#);
}

#[test]
fn rewrites_styled_factory_to_intrinsic() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.div color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_red" />;"#);
}

#[test]
fn styled_factory_respects_as_prop_over_default_tag() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.div as="a" color="red" href="/home" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <a href="/home" className="color_red" />;"#);
}

#[test]
fn respects_static_as_prop_on_box() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box as="section" color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <section className="color_red" />;"#);
}

#[test]
fn rewrites_paired_element_closing_tag() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red">child</Box>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_red">child</div>;"#);
}

#[test]
fn paired_styled_element_uses_as_for_closing_tag() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.button as="a" color="red">link</styled.button>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <a className="color_red">link</a>;"#);
}

#[test]
fn merges_existing_static_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="foo" color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="foo color_red" />;"#);
}

#[test]
fn merges_existing_class_name_with_style_props_and_css_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="foo" color="red" css={{ padding: '2' }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="foo color_red padding_2" />;"#);
}

#[test]
fn merges_dynamic_class_name_with_style_props_and_css_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color="red" css={{ padding: '2' }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_red padding_2"} />;"#);
}

#[test]
fn merges_dynamic_class_name_with_inline_concat() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={props.className + " color_red"} />;"#);
}

#[test]
fn wraps_a_leading_ternary_class_name_before_appending() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={ok ? 'a' : 'b'} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={(ok ? 'a' : 'b') + " color_red"} />;"#);
}

#[test]
fn leaves_dynamic_style_prop_untouched_without_file_bail() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color={props.color} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { Box } from '@panda/jsx';
    export const el = <Box color={props.color} />;
    "#);
}

#[test]
fn leaves_spread_element_untouched_without_file_bail() {
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
fn rewrites_static_sites_in_mixed_jsx_file() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const ok = <Box color="red" />;
        export const skip = <Box color={props.color} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { Box } from '@panda/jsx';
    export const ok = <div className="color_red" />;
    export const skip = <Box color={props.color} />;
    "#);
}

#[test]
fn rewrites_recipe_jsx_element() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = <Button size="sm" color="red" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="button button--size_sm color_red" />;"#);
}

#[test]
fn leaves_a_recipe_jsx_component_from_a_library_untouched() {
    // `jsx: ["Button"]` matches by name for CSS extraction, but a Button imported
    // from the user's own library is not Panda-owned: the component applies the
    // recipe internally, so the transform must not rewrite the call site.
    let source = indoc! {r#"
        import { Button } from '@/components/button';
        export const el = <Button size="sm" color="red" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(!output.changed);
    assert_snapshot!(output.code, @r#"
    import { Button } from '@/components/button';
    export const el = <Button size="sm" color="red" />;
    "#);
}

#[test]
fn leaves_a_style_prop_component_from_a_library_untouched() {
    let source = indoc! {r#"
        import { Card } from '@/components/card';
        export const el = <Card color="red" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(!output.changed);
    assert_snapshot!(output.code, @r#"
    import { Card } from '@/components/card';
    export const el = <Card color="red" />;
    "#);
}

#[test]
fn rewrites_recipe_jsx_with_deeply_nested_conditional_style_prop() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = (
          <Button
            size="sm"
            _hover={{ _dark: { color: isDark ? 'white' : 'black' } }}
          />
        );
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const el = (
      <div className={isDark ? "button button--size_sm hover:dark:color_white" : "button button--size_sm hover:dark:color_black"} />
    );
    "#);
}

#[test]
fn rewrites_pattern_jsx_element() {
    let source = indoc! {r#"
        import { Stack } from '@panda/jsx';
        export const el = <Stack gap="4" />;
    "#};

    let output = transform_jsx_patterns("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="gap_4" />;"#);
}

#[test]
fn rewrites_pattern_jsx_with_deeply_nested_conditional_style_prop() {
    let source = indoc! {r#"
        import { Stack } from '@panda/jsx';
        export const el = (
          <Stack
            gap="4"
            _hover={{ _dark: { color: isDark ? 'white' : 'black' } }}
          />
        );
    "#};

    let output = transform_jsx_patterns("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const el = (
      <div className={isDark ? "gap_4 hover:dark:color_white" : "gap_4 hover:dark:color_black"} />
    );
    "#);
}

#[test]
fn rewrites_conditional_jsx_style_props() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="blue" _hover={{ color: 'red' }} md={{ padding: '4px' }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_blue hover:color_red md:padding_4px" />;"#);
}

#[test]
fn rewrites_static_as_component_identifier() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.div as={Link} color="red" href="/home" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <Link href="/home" className="color_red" />;"#);
}

#[test]
fn panda_factory_member_rewrites_to_intrinsic_tag() {
    let source = indoc! {r#"
        import { panda } from '@panda/jsx';
        export const el = <panda.footer color="red" fontWeight="bold">footer</panda.footer>;
    "#};

    let output = transform_panda_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <footer className="color_red font-weight_bold">footer</footer>;"#);
}

#[test]
fn box_as_component_identifier_rewrites_to_component_tag() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box as={ChevronDownIcon} color="red" />;
    "#};

    let output = transform_panda_jsx_patterns("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <ChevronDownIcon className="color_red" />;"#);
}

#[test]
fn pattern_jsx_css_prop_rewrites_nested_styles() {
    let source = indoc! {r#"
        import { HStack } from '@panda/jsx';
        export const el = <HStack gap="4" css={{ color: 'red' }} />;
    "#};

    let output = transform_panda_jsx_patterns("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="color_red gap_4" />;"#);
}

#[test]
fn wrap_pattern_jsx_rewrites_static_props() {
    let source = indoc! {r#"
        import { Wrap } from '@panda/jsx';
        export const el = <Wrap gap="6" justifyContent="center" />;
    "#};

    let output = transform_panda_jsx_patterns("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className="gap_6 justify-content_center" />;"#);
}

#[test]
fn skips_unresolved_dynamic_as_expression() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.div as={props.as} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { styled } from '@panda/jsx';
    export const el = <styled.div as={props.as} color="red" />;
    "#);
}

#[test]
fn rewrites_jsx_runtime_call() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: 'color_red' });
    ");
}

#[test]
fn rewrites_create_element_call() {
    let source = indoc! {r#"
        import React from 'react';
        import { Box } from '@panda/jsx';

        export const el = React.createElement(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import React from 'react';

    export const el = React.createElement('div', { children: 'hi', className: 'color_red' });
    ");
}

#[test]
fn runtime_call_respects_static_as_component() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { as: Link, color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx(Link, { children: 'hi', className: 'color_red' });
    ");
}

#[test]
fn runtime_call_respects_static_as_string_on_styled() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { styled } from '@panda/jsx';

        export const el = jsx(styled.a, { as: 'button', color: 'red', type: 'submit' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('button', { type: 'submit', className: 'color_red' });
    ");
}

#[test]
fn runtime_mixed_static_and_dynamic_calls() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        jsx(Box, { color: 'red' });
        jsx(Box, { color: props.color });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';
    import { Box } from '@panda/jsx';

    jsx('div', { className: 'color_red' });
    jsx(Box, { color: props.color });
    "#);
}

#[test]
fn skips_dynamic_as_prop_on_styled_element() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.div as={props.as} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { styled } from '@panda/jsx';
    export const el = <styled.div as={props.as} color="red" />;
    "#);
}

#[test]
fn rewrites_finite_conditional_style_prop_to_ternary_class_name() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={isError ? "color_red" : "color_blue"} />;"#);
}

#[test]
fn rewrites_conditional_style_prop_with_static_class_name_peel() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className="foo" color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={"foo" + " " + (isError ? "color_red" : "color_blue")} />;"#);
}

#[test]
fn injects_cn_for_dynamic_class_name_with_conditional_style_prop() {
    use super::common::transform_jsx_with_helper;
    use pandacss_project::HelperCxMode;

    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={props.className} color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx_with_helper("src/app.tsx", source, HelperCxMode::Auto);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    export const el = <div className={__pcx(props.className, isError ? "color_red" : "color_blue")} />;
    "#);
}

#[test]
fn rewrites_nested_hover_conditional_prop_to_ternary_classes() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="blue" _hover={{ color: isDark ? 'white' : 'black' }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={isDark ? "color_blue hover:color_white" : "color_blue hover:color_black"} />;"#);
}

#[test]
fn rewrites_two_independent_conditionals_within_branch_budget() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color={a ? 'red' : 'blue'} padding={b ? '1px' : '2px'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={(a ? "color_red" : "color_blue") + " " + (b ? "padding_1px" : "padding_2px")} />;"#);
}

#[test]
fn rewrites_runtime_call_with_finite_conditional_prop() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: isError ? 'red' : 'blue', children: 'hi' });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: isError ? "color_red" : "color_blue" });
    "#);
}

#[test]
fn mixed_jsx_file_handles_conditional_static_skip_and_open_ended() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const ok = <Box color={ok ? 'red' : 'blue'} />;
        export const alsoOk = <Box color="green" />;
        export const overBudget = (
          <Box color={a ? 'red' : 'blue'} bg={b ? 'white' : 'black'} padding={c ? '1' : '2'} margin={d ? '3' : '4'} />
        );
        export const openEnded = <Box color={props.color} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { Box } from '@panda/jsx';
    export const ok = <div className={ok ? "color_red" : "color_blue"} />;
    export const alsoOk = <div className="color_green" />;
    export const overBudget = (
      <div className={(a ? "color_red" : "color_blue") + " " + (b ? "bg_white" : "bg_black") + " " + (c ? "padding_1" : "padding_2") + " " + (d ? "margin_3" : "margin_4")} />
    );
    export const openEnded = <Box color={props.color} />;
    "#);
}

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
fn skips_complex_as_ternary_on_styled_element() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const el = <styled.div as={cond ? Link : 'a'} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    import { styled } from '@panda/jsx';
    export const el = <styled.div as={cond ? Link : 'a'} color="red" />;
    "#);
}

#[test]
fn rewrites_conditional_with_static_style_peel() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box padding="4px" color={isError ? 'red' : 'blue'} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={isError ? "color_red padding_4px" : "color_blue padding_4px"} />;"#);
}

#[test]
fn rewrites_four_independent_conditionals_on_multiline_element() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = (
          <Box
            color={a ? 'red' : 'blue'}
            bg={b ? 'white' : 'black'}
            padding={c ? '1' : '2'}
            margin={d ? '3' : '4'}
          />
        );
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"
    export const el = (
      <div className={(a ? "color_red" : "color_blue") + " " + (b ? "bg_white" : "bg_black") + " " + (c ? "padding_1" : "padding_2") + " " + (d ? "margin_3" : "margin_4")} />
    );
    "#);
}

#[test]
fn skips_jsx_rewrite_when_conditional_site_count_exceeds_budget() {
    use super::common::{create_config, transform_jsx_with_project};
    use pandacss_project::{Project, System};
    use serde_json::{Map, Value, json};

    let mut utilities = Map::new();
    for index in 0..=64 {
        utilities.insert(format!("prop{index}"), json!({}));
    }

    let project = Project::new(
        System::new(create_config(json!({
            "jsxFramework": "react",
            "utilities": Value::Object(utilities),
            "conditions": {
                "hover": "&:hover"
            }
        })))
        .expect("config"),
    );

    let mut props = String::new();
    for index in 0..=64 {
        props.push_str(&format!(" prop{index}={{v{index} ? 'red' : 'blue'}}"));
    }
    let source =
        format!("import {{ Box }} from '@panda/jsx';\nexport const el = <Box{props} />;\n");

    let output = transform_jsx_with_project(&project, "src/app.tsx", &source);

    assert!(!output.changed);
    assert!(!output.bailed);
    assert_eq!(output.code, source);
}

#[test]
fn jsx_only_target_does_not_rewrite_css_calls() {
    let project = project_with_jsx();
    let source = indoc! {r#"
        import { css } from '@panda/css';
        export const cls = css({ color: 'red' });
    "#};

    let output = transform_jsx_with_project(&project, "src/app.tsx", source);

    assert!(!output.changed);
    assert_snapshot!(output.code, @r#"
    import { css } from '@panda/css';
    export const cls = css({ color: 'red' });
    "#);
}

#[test]
fn rewrites_deeply_nested_hover_dark_conditional_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box _hover={{ _dark: { color: isDark ? 'white' : 'black' } }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={isDark ? "hover:dark:color_white" : "hover:dark:color_black"} />;"#);
}

#[test]
fn rewrites_property_level_deeply_nested_conditional_prop() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color={{ _hover: { md: isWide ? 'blue' : 'green' } }} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={isWide ? "hover:md:color_blue" : "hover:md:color_green"} />;"#);
}

#[test]
fn rewrites_runtime_call_with_deeply_nested_conditional_prop() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, {
            _hover: { _dark: { color: isDark ? 'white' : 'black' } },
            children: 'hi',
        });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', className: isDark ? "hover:dark:color_white" : "hover:dark:color_black" });
    "#);
}

#[test]
fn rewrites_nested_conditional_with_static_peel_on_same_element() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = (
          <Box
            color="blue"
            _hover={{ _dark: { color: isDark ? 'white' : 'black' } }}
          />
        );
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const el = (
      <div className={isDark ? "color_blue hover:dark:color_white" : "color_blue hover:dark:color_black"} />
    );
    "#);
}

#[test]
fn rewrites_box_to_intrinsic_with_class_name_solid() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class="color_red" />;"#);
}

#[test]
fn merges_dynamic_class_expression_solid() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={props.class} color="red" />;
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={props.class + " color_red"} />;"#);
}

#[test]
fn rewrites_jsx_runtime_call_solid() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';

        export const el = jsx(Box, { color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx_solid("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { jsx } from 'react/jsx-runtime';

    export const el = jsx('div', { children: 'hi', class: 'color_red' });
    ");
}

#[test]
fn runtime_call_with_a_computed_property_stays_unchanged() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';
        export const el = jsx(Box, { color: 'red', [runtimeKey]: value });
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';
    import { Box } from '@panda/jsx';
    export const el = jsx(Box, { color: 'red', [runtimeKey]: value });
    "#);
}

#[test]
fn similarly_named_class_helper_does_not_block_a_rewrite() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={notclsx(value)} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={notclsx(value) + " color_red"} />;"#);
}

#[test]
fn helper_text_inside_a_string_class_does_not_block_a_rewrite() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box className={'clsx('} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div className={'clsx(' + " color_red"} />;"#);
}

#[test]
fn dollar_prefixed_as_identifier_is_preserved_as_a_component() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box as={$Component} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <$Component className="color_red" />;"#);
}

#[test]
fn rewrites_box_to_intrinsic_with_class_name_qwik() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class="color_red" />;"#);
}

#[test]
fn merges_dynamic_class_expression_qwik() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={styles.container} color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={styles.container + " color_red"} />;"#);
}

#[test]
fn merges_resolved_class_into_qwik_array_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={[styles.container, 'p-8']} color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[styles.container, 'p-8', "color_red"]} />;"#);
}

#[test]
fn merges_resolved_class_into_qwik_mixed_array_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={[styles.container, 'p-8', flag ? 'a' : 'b', { active: true }]} color="red" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[styles.container, 'p-8', flag ? 'a' : 'b', { active: true }, "color_red"]} />;"#);
}

#[test]
fn merges_qwik_class_collections_from_oxc_spans() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const withTrailingComma = <Box class={([styles.container,] as const)} color="red" />;
        export const empty = <Box class={([] as const)} color="blue" />;
        export const record = <Box class={({ active: true } as const)} color="green" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    export const withTrailingComma = <div class={([styles.container, "color_red",] as const)} />;
    export const empty = <div class={(["color_blue"] as const)} />;
    export const record = <div class={[({ active: true } as const), "color_green"]} />;
    "#);
}

#[test]
fn merges_resolved_class_into_qwik_record_expression() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box class={{ 'text-red-500': isError, 'p-4': true }} color="blue" />;
    "#};

    let output = transform_jsx_qwik("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <div class={[{ 'text-red-500': isError, 'p-4': true }, "color_blue"]} />;"#);
}
