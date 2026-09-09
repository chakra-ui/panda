//! Recipe and pattern JSX components.

use super::common::{transform_jsx_patterns, transform_jsx_recipes, transform_panda_jsx_patterns};
use indoc::indoc;
use insta::assert_snapshot;

// `jsx: ["Button"]` tracks the element; codegen ships `createRecipeContext`, not
// the component. Button is the user's, so the tag and `size` stay.
#[test]
fn folds_recipe_jsx_style_props_into_class_name() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = <Button size="sm" color="red" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { Button } from '@acme/ui';
    export const el = <Button size="sm" className="color_red" />;
    "#);
}

// A variant wins over the css property of the same name, as `splitJsxProps` does.
#[test]
fn keeps_a_variant_named_like_a_css_property() {
    let source = indoc! {r#"
        import { Chip } from '@acme/ui';
        export const el = <Chip color="brand" fontSize="12px" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { Chip } from '@acme/ui';
    export const el = <Chip color="brand" className="fs_12px" />;
    "#);
}

#[test]
fn leaves_a_recipe_jsx_element_with_a_spread_untouched() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = <Button size="sm" color="red" {...rest} />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn leaves_a_recipe_jsx_element_with_a_dynamic_style_value_untouched() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = <Button size="sm" color={tone} />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

// Same rule in the object spelling.
#[test]
fn folds_recipe_style_props_in_a_jsx_runtime_call() {
    let source = indoc! {r#"
        import { jsx } from 'react/jsx-runtime';
        import { Button } from '@acme/ui';
        export const el = jsx(Button, { size: 'sm', color: 'red', children: 'hi' });
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { jsx } from 'react/jsx-runtime';
    import { Button } from '@acme/ui';
    export const el = jsx(Button, { size: 'sm', children: 'hi', className: 'color_red' });
    "#);
}

#[test]
fn merges_an_existing_class_name_when_folding_recipe_style_props() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = <Button size="sm" color="red" className="mine" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { Button } from '@acme/ui';
    export const el = <Button size="sm" className="mine color_red" />;
    "#);
}

#[test]
fn keeps_non_style_props_when_folding() {
    let source = indoc! {r#"
        import { Button } from '@acme/ui';
        export const el = <Button size="sm" color="red" onClick={go} aria-label="save" />;
    "#};

    let output = transform_jsx_recipes("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { Button } from '@acme/ui';
    export const el = <Button size="sm" onClick={go} aria-label="save" className="color_red" />;
    "#);
}

#[test]
fn leaves_a_recipe_jsx_component_from_a_library_untouched() {
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
fn folds_a_conditional_recipe_style_prop_into_a_class_expression() {
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
    import { Button } from '@acme/ui';
    export const el = (
      <Button size="sm" className={isDark ? "hover:dark:color_white" : "hover:dark:color_black"} />
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
