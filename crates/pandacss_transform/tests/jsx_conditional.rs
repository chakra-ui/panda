//! Lowering conditional style props to ternary class names.

use super::common::transform_jsx;
use indoc::indoc;
use insta::assert_snapshot;

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
fn rewrites_optional_style_prop_with_undefined_alternate() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        export const el = <Box width={full ? '100%' : undefined} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert_snapshot!(output.code, @r#"export const el = <div className={full ? "width_100%" : ""} />;"#);
}

#[test]
fn rewrites_styled_button_with_nested_ternaries_and_undefined_width() {
    // css-in-js-bench panda-props btn-variant shape: nested value ternaries plus
    // an optional width that used to bail the whole element on free `undefined`.
    // Use r## so hex `#…` strings don't terminate the raw literal.
    let source = indoc! {r##"
        import { styled } from '@panda/jsx';
        export const Button = ({ $active, $fullWidth, $variant, children }) => (
          <styled.button
            display="inline-flex"
            backgroundColor={$variant === "ghost" ? "transparent" : $variant === "secondary" ? "#f3f4f6" : !$active ? "#d1d5db" : "#2563eb"}
            color={$variant === "ghost" ? "#2563eb" : $variant === "secondary" ? "#111827" : !$active ? "#6b7280" : "#ffffff"}
            width={$fullWidth ? "100%" : undefined}
          >{children}</styled.button>
        );
    "##};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert!(!output.bailed);
    assert!(!output.code.contains("styled.button"));
    assert!(output.code.contains("<button"));
    assert_snapshot!(output.code, @r#"
    export const Button = ({ $active, $fullWidth, $variant, children }) => (
      <button className={"d_inline-flex" + " " + ($variant === "ghost" ? "bg_transparent" : $variant === "secondary" ? "bg_#f3f4f6" : !$active ? "bg_#d1d5db" : "bg_#2563eb") + " " + ($variant === "ghost" ? "color_#2563eb" : $variant === "secondary" ? "color_#111827" : !$active ? "color_#6b7280" : "color_#ffffff") + ($fullWidth ? " width_100%" : "")}>{children}</button>
    );
    "#);
}

#[test]
fn shadowed_undefined_alternate_still_bails_jsx_rewrite() {
    let source = indoc! {r#"
        import { Box } from '@panda/jsx';
        let undefined = dynamic;
        export const el = <Box width={full ? '100%' : undefined} />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(!output.changed || output.code.contains("<Box"));
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
