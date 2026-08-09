//! Recipe and pattern JSX components.

use super::common::{transform_jsx_patterns, transform_jsx_recipes, transform_panda_jsx_patterns};
use indoc::indoc;
use insta::assert_snapshot;

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
