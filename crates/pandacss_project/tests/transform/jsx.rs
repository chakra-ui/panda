//! Element-level JSX rewriting: tag selection, the `as` prop, and closing tags.

use super::common::{
    project_with_jsx, transform_jsx, transform_jsx_with_project, transform_panda_jsx,
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
fn dollar_prefixed_as_identifier_is_preserved_as_a_component() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box as={$Component} color="red" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"export const el = <$Component className="color_red" />;"#);
}
