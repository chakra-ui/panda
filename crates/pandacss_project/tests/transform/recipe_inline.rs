//! Inline `cva()` / `sva()` call transforms.

use super::common::{project_with_jsx, transform, transform_with_project};
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn rewrites_inline_cva_to_string_branch_config() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'red', backgroundColor: 'blue' },
          variants: {
            size: {
              sm: { fontSize: '12px' },
              md: { fontSize: '16px' },
            },
          },
          defaultVariants: { size: 'md' },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    export const button = __pcva({ base: 'background-color_blue color_red', variants: { size: { sm: 'fs_12px', md: 'fs_16px' } }, defaultVariants: { size: 'md' } });
    "#);
}

#[test]
fn rewrites_inline_sva_to_string_branch_config() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          base: {
            root: { display: 'flex' },
            trigger: { cursor: 'pointer' },
          },
          variants: {
            size: {
              sm: {
                root: { fontSize: '12px' },
                trigger: { fontSize: '12px' },
              },
            },
          },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_sva);
    assert_snapshot!(output.code, @r#"
    import { sva as __psva } from '@pandacss-internal/css';
    export const tabs = __psva({ slots: ['root', 'trigger'], base: { root: 'd_flex', trigger: 'cursor_pointer' }, variants: { size: { sm: 'fs_12px' } } });
    "#);
}

#[test]
fn rewrites_cva_with_compound_variants() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'white' },
          variants: {
            size: {
              sm: { fontSize: '12px' },
            },
            intent: {
              danger: { backgroundColor: 'red' },
            },
          },
          compoundVariants: [
            { size: 'sm', intent: 'danger', css: { color: 'black' } },
          ],
          defaultVariants: { size: 'sm', intent: 'danger' },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    export const button = __pcva({ base: 'color_white', variants: { size: { sm: 'fs_12px' }, intent: { danger: 'background-color_red' } }, defaultVariants: { size: 'sm', intent: 'danger' }, compoundVariants: [{ size: 'sm', intent: 'danger', css: 'color_black' }] });
    "#);
}

#[test]
fn bails_on_cva_raw_member_call() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva.raw({ base: { color: 'red' } });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn bails_on_sva_when_variant_styles_differ_per_slot() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const card = sva({
          slots: ['root', 'header'],
          variants: {
            size: {
              sm: {
                root: { padding: '4px' },
                header: { fontSize: '12px' },
              },
            },
          },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn rewrites_styled_with_full_recipe_config() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export const Card = styled('div', {
          base: { color: 'red', padding: '8px' },
          variants: {
            size: {
              sm: { fontSize: '12px' },
              md: { fontSize: '16px' },
            },
          },
          defaultVariants: { size: 'md' },
        });
    "#};

    let output = transform_with_project(&project_with_jsx(), "src/app.tsx", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    export const Card = styled('div', __pcva({ base: 'color_red padding_8px', variants: { size: { sm: 'fs_12px', md: 'fs_16px' } }, defaultVariants: { size: 'md' } }));
    "#);
}

#[test]
fn rewrites_an_aliased_styled_factory_from_its_callee_shape() {
    let source = indoc! {r#"
        import { styled as s } from '@panda/jsx';
        export const Card = s('div', { color: 'red' });
    "#};

    let output = transform_with_project(&project_with_jsx(), "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled as s } from '@panda/jsx';
    export const Card = s('div', __pcva({ base: 'color_red' }));
    "#);
}

#[test]
fn injects_cx_cva_and_sva_symbols_in_one_import() {
    let source = indoc! {r#"
        import { Box, styled } from '@panda/jsx';
        import { cva, sva } from '@panda/css';
        export const el = <Box className={props.className} color={isError ? 'red' : 'blue'} />;
        export const button = cva({ base: { color: 'blue' } });
        export const tabs = sva({ base: { root: { display: 'flex' } } });
        export const Card = styled('div', { color: 'green' });
    "#};

    let output = transform_with_project(&project_with_jsx(), "src/app.tsx", source);

    assert!(output.changed);
    assert!(output.helper.needs_cx);
    assert!(output.helper.needs_cva);
    assert!(output.helper.needs_sva);
    assert!(output.code.starts_with(
        "import { cx as __pcx, cva as __pcva, sva as __psva } from '@pandacss-internal/css';\n"
    ));
    assert!(!output.code.contains("import { cva"));
    assert!(!output.code.contains("import { Box"));
}

#[test]
fn rewrites_cva_base_with_property_conditional() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ base: { color: cond ? 'red' : 'blue' } });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    export const button = __pcva({ base: cond ? "color_red" : "color_blue" });
    "#);
}

#[test]
fn injects_both_cva_and_sva_symbols_when_needed() {
    let source = indoc! {r#"
        import { cva, sva } from '@panda/css';
        export const button = cva({ base: { color: 'red' } });
        export const tabs = sva({ base: { root: { display: 'flex' } } });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert!(output.helper.needs_sva);
    assert!(
        output.code.starts_with(
            "import { cva as __pcva, sva as __psva } from '@pandacss-internal/css';\n"
        )
    );
}
