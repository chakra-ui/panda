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

#[test]
fn keeps_boolean_cva_call_sites_on_memoized_runtime() {
    // Call-site → `__pcx` lowering is intentionally off: reused prop tuples
    // win with `__pcva` boolean bitset + memo (bench btn-variant).
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const recipe = cva({
          base: { display: 'inline-flex' },
          variants: {
            r0: { true: { opacity: '0.5' } },
            r1: { true: { fontSize: '12px' } },
          },
          defaultVariants: { r0: true },
        });
        export const cls = recipe({
          r0: !active,
          r1: variant === 'secondary' || variant === 'outline',
        });
        export const baseOnly = recipe();
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert!(!output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const recipe = __pcva({ base: 'd_inline-flex', variants: { r0: { true: 'opacity_0.5' }, r1: { true: 'fs_12px' } }, defaultVariants: { r0: true } });
    export const cls = recipe({
      r0: !active,
      r1: variant === 'secondary' || variant === 'outline',
    });
    export const baseOnly = recipe();
    "#);
}

#[test]
fn does_not_lower_non_boolean_cva_call_sites() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({
          base: { color: 'red' },
          variants: {
            size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' } },
          },
        });
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(output.helper.needs_cva);
    assert!(!output.helper.needs_cx);
    assert!(output.code.contains("button({ size: 'sm' })"));
}

// ---------------------------------------------------------------------------
// `binding.raw(props)` on an inline cva/sva folds to the resolved style object.
// Expectations mirror the generated `styled-system` runtime.
// ---------------------------------------------------------------------------

#[test]
fn folds_cva_raw_with_base_only() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles.raw({});
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red' });
    export const out = {"color":"red"};
    "#);
}

#[test]
fn folds_cva_raw_applying_default_variants() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' }, lg: { padding: '8px' } } },
          defaultVariants: { size: 'sm' },
        });
        export const out = styles.raw({});
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { size: { sm: 'padding_4px', lg: 'padding_8px' } }, defaultVariants: { size: 'sm' } });
    export const out = {"color":"red","padding":"4px"};
    "#);
}

#[test]
fn folds_cva_raw_with_an_explicit_variant_overriding_the_default() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' }, lg: { padding: '8px' } } },
          defaultVariants: { size: 'sm' },
        });
        export const out = styles.raw({ size: 'lg' });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { size: { sm: 'padding_4px', lg: 'padding_8px' } }, defaultVariants: { size: 'sm' } });
    export const out = {"color":"red","padding":"8px"};
    "#);
}

#[test]
fn folds_cva_raw_ignoring_an_unknown_variant_value() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } } },
        });
        export const out = styles.raw({ size: 'xl' });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { size: { sm: 'padding_4px' } } });
    export const out = {"color":"red"};
    "#);
}

#[test]
fn folds_cva_raw_with_a_matching_compound_variant() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } }, tone: { a: { color: 'blue' } } },
          compoundVariants: [{ size: 'sm', tone: 'a', css: { margin: '2px' } }],
        });
        export const out = styles.raw({ size: 'sm', tone: 'a' });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { size: { sm: 'padding_4px' }, tone: { a: 'color_blue' } }, compoundVariants: [{ size: 'sm', tone: 'a', css: 'margin_2px' }] });
    export const out = {"color":"blue","padding":"4px","margin":"2px"};
    "#
    );
}

#[test]
fn folds_cva_raw_skipping_an_unmatched_compound_variant() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } }, tone: { a: { color: 'blue' } } },
          compoundVariants: [{ size: 'sm', tone: 'a', css: { margin: '2px' } }],
        });
        export const out = styles.raw({ size: 'sm' });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { size: { sm: 'padding_4px' }, tone: { a: 'color_blue' } }, compoundVariants: [{ size: 'sm', tone: 'a', css: 'margin_2px' }] });
    export const out = {"color":"red","padding":"4px"};
    "#);
}

#[test]
fn folds_cva_raw_with_a_boolean_variant() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({
          base: { color: 'red' },
          variants: { on: { true: { opacity: '0.5' } } },
        });
        export const out = styles.raw({ on: true });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { on: { true: 'opacity_0.5' } } });
    export const out = {"color":"red","opacity":"0.5"};
    "#);
}

#[test]
fn folds_sva_raw_to_one_object_per_slot() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        const styles = sva({
          slots: ['root', 'icon'],
          base: { root: { color: 'red' }, icon: { padding: '1px' } },
          variants: { size: { sm: { root: { padding: '4px' } } } },
          defaultVariants: { size: 'sm' },
        });
        export const out = styles.raw({});
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"
    import { sva as __psva } from '@pandacss-internal/css';
    const styles = __psva({ slots: ['root', 'icon'], base: { root: 'color_red', icon: 'padding_1px' }, variants: { size: { sm: 'padding_4px' } }, defaultVariants: { size: 'sm' } });
    export const out = {"root":{"color":"red","padding":"4px"},"icon":{"padding":"1px"}};
    "#
    );
}

#[test]
fn cva_raw_with_dynamic_props_keeps_the_runtime_recipe() {
    // The desugared runtime's `raw` returns class strings, so the definition
    // has to stay as the real `cva`.
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' }, variants: { size: { sm: { padding: '4px' } } } });
        export const out = styles.raw({ size: props.size });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn sva_raw_with_dynamic_props_keeps_the_runtime_recipe() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        const styles = sva({ slots: ['root'], base: { root: { color: 'red' } } });
        export const out = styles.raw(props);
    "#};

    let output = transform("src/a.tsx", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn cva_raw_and_plain_calls_coexist_when_raw_folds() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' }, variants: { size: { sm: { padding: '4px' } } } });
        export const out = styles.raw({ size: 'sm' });
        export const cls = styles({ size: props.size });
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert_snapshot!(
        output.code,
        @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    const styles = __pcva({ base: 'color_red', variants: { size: { sm: 'padding_4px' } } });
    export const out = {"color":"red","padding":"4px"};
    export const cls = styles({ size: props.size });
    "#
    );
}

/// Fixture shared by the slot compound-variant cases. Expected values below are
/// what the generated `styled-system` `sva(...).raw` returns for each selection.
macro_rules! sva_compound_source {
    ($raw_args:literal) => {
        concat!(
            "import { sva } from '@panda/css';\n",
            "const styles = sva({\n",
            "  slots: ['root', 'icon'],\n",
            "  base: { root: { color: 'red' }, icon: { padding: '1px' } },\n",
            "  variants: {\n",
            "    size: { sm: { root: { padding: '4px' } }, lg: { root: { padding: '8px' }, icon: { margin: '2px' } } },\n",
            "    tone: { a: { root: { color: 'blue' } } },\n",
            "  },\n",
            "  defaultVariants: { size: 'sm' },\n",
            "  compoundVariants: [\n",
            "    { size: 'sm', tone: 'a', css: { root: { outline: '1px' }, icon: { border: '9px' } } },\n",
            "    { size: 'lg', css: { icon: { border: '3px' } } },\n",
            "  ],\n",
            "});\n",
            "export const out = styles.raw(", $raw_args, ");\n",
        )
    };
}

#[test]
fn folds_sva_raw_applying_default_variants_per_slot() {
    let output = transform("src/a.tsx", sva_compound_source!("{}"));

    assert!(output.changed);
    assert!(
        output.code.ends_with(concat!(
            r#"export const out = {"root":{"color":"red","padding":"4px"},"#,
            r#""icon":{"padding":"1px"}};"#,
            "\n"
        )),
        "{}",
        output.code
    );
}

#[test]
fn folds_sva_raw_applying_a_matching_compound_variant_to_every_slot() {
    let output = transform(
        "src/a.tsx",
        sva_compound_source!("{ size: 'sm', tone: 'a' }"),
    );

    assert!(output.changed);
    assert!(
        output.code.ends_with(concat!(
            r#"export const out = {"root":{"color":"blue","padding":"4px","outline":"1px"},"#,
            r#""icon":{"padding":"1px","border":"9px"}};"#,
            "\n"
        )),
        "{}",
        output.code
    );
}

#[test]
fn folds_sva_raw_when_a_compound_variant_touches_one_slot_only() {
    let output = transform("src/a.tsx", sva_compound_source!("{ size: 'lg' }"));

    assert!(output.changed);
    assert!(
        output.code.ends_with(concat!(
            r#"export const out = {"root":{"color":"red","padding":"8px"},"#,
            r#""icon":{"padding":"1px","margin":"2px","border":"3px"}};"#,
            "\n"
        )),
        "{}",
        output.code
    );
}

macro_rules! cva_array_compound_source {
    ($raw_args:literal) => {
        concat!(
            "import { cva } from '@panda/css';\n",
            "const styles = cva({\n",
            "  base: { color: 'red' },\n",
            "  variants: { size: { sm: { padding: '4px' }, md: { padding: '6px' }, lg: { padding: '8px' } } },\n",
            "  compoundVariants: [{ size: ['sm', 'md'], css: { margin: '2px' } }],\n",
            "});\n",
            "export const out = styles.raw(", $raw_args, ");\n",
        )
    };
}

fn assert_folds_to(source: &str, expected: &str) {
    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert!(
        output
            .code
            .ends_with(&format!("export const out = {expected};\n")),
        "{}",
        output.code
    );
}

#[test]
fn folds_cva_raw_with_the_first_value_of_an_array_compound_condition() {
    assert_folds_to(
        cva_array_compound_source!("{ size: 'sm' }"),
        r#"{"color":"red","padding":"4px","margin":"2px"}"#,
    );
}

#[test]
fn folds_cva_raw_with_a_later_value_of_an_array_compound_condition() {
    assert_folds_to(
        cva_array_compound_source!("{ size: 'md' }"),
        r#"{"color":"red","padding":"6px","margin":"2px"}"#,
    );
}

#[test]
fn folds_cva_raw_skipping_an_array_compound_condition_that_excludes_the_value() {
    assert_folds_to(
        cva_array_compound_source!("{ size: 'lg' }"),
        r#"{"color":"red","padding":"8px"}"#,
    );
}

#[test]
fn folds_cva_raw_when_a_compound_condition_names_an_unselected_variant() {
    assert_folds_to(cva_array_compound_source!("{}"), r#"{"color":"red"}"#);
}

/// The desugared runtime's `raw` returns class strings, so the definition may
/// only be rewritten when every `.raw` use in the file has been folded away.
fn assert_keeps_runtime_recipe(source: &str) {
    let output = transform("src/a.tsx", source);

    assert!(!output.changed, "{}", output.code);
    assert_eq!(output.code, source);
}

#[test]
fn a_bare_raw_reference_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const fn = styles.raw;
    "#});
}

#[test]
fn an_optional_chained_raw_call_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles?.raw({});
    "#});
}

#[test]
fn raw_passed_as_a_callback_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = [{ size: 'sm' }].map(styles.raw);
    "#});
}

#[test]
fn a_bare_sva_raw_reference_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { sva } from '@panda/css';
        const styles = sva({ slots: ['root'], base: { root: { color: 'red' } } });
        export const fn = styles.raw;
    "#});
}

#[test]
fn one_dynamic_raw_call_keeps_the_runtime_recipe_for_every_site() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' }, variants: { size: { sm: { padding: '4px' } } } });
        export const a = styles.raw({ size: 'sm' });
        export const b = styles.raw({ size: props.size });
    "#});
}

#[test]
fn a_spread_raw_argument_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles.raw({ ...props });
    "#});
}

#[test]
fn a_second_raw_argument_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles.raw({ size: 'sm' }, { size: 'lg' });
    "#});
}

#[test]
fn a_computed_raw_key_keeps_the_runtime_recipe() {
    assert_keeps_runtime_recipe(indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' }, variants: { size: { sm: { padding: '4px' } } } });
        export const out = styles.raw({ [key]: 'sm' });
    "#});
}

#[test]
fn folds_a_raw_call_nested_inside_a_function() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export function f() { return styles.raw({}); }
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert!(
        output.code.contains(r#"return {"color":"red"};"#),
        "{}",
        output.code
    );
}

#[test]
fn folds_every_static_raw_call_on_one_binding() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' }, variants: { size: { sm: { padding: '4px' } } } });
        export const a = styles.raw({ size: 'sm' });
        export const b = styles.raw({});
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert!(
        output
            .code
            .contains(r#"export const a = {"color":"red","padding":"4px"};"#),
        "{}",
        output.code
    );
    assert!(
        output.code.contains(r#"export const b = {"color":"red"};"#),
        "{}",
        output.code
    );
}

#[test]
fn a_shadowed_raw_call_does_not_block_the_desugar() {
    // The inner `styles` is a different symbol, so it is not a `.raw` use of
    // the module-level recipe.
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export function f(styles) { return styles.raw({}); }
    "#};

    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    assert!(output.code.contains("__pcva("), "{}", output.code);
    assert!(
        output.code.contains("return styles.raw({});"),
        "{}",
        output.code
    );
}

#[test]
fn folds_an_imported_cva_raw_call() {
    let button = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' }, lg: { padding: '8px' } } },
          defaultVariants: { size: 'sm' },
        });
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { button } from './button';
        export const cls = css(button.raw({ size: 'lg' }), { color: 'blue' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);

    assert!(output.changed);
    assert!(!output.code.contains("button.raw"), "{}", output.code);
}

#[test]
fn an_imported_cva_raw_call_applies_default_variants() {
    let button = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } } },
          defaultVariants: { size: 'sm' },
        });
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { button } from './button';
        export const styles = button.raw({});
        export const cls = css({ color: 'blue' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);

    assert!(output.changed);
    assert!(
        output.code.contains(r#"{"color":"red","padding":"4px"}"#),
        "{}",
        output.code
    );
}

#[test]
fn folds_an_imported_sva_raw_call_per_slot() {
    let recipe = indoc! {r#"
        import { sva } from '@panda/css';
        export const parts = sva({
          slots: ['root', 'label'],
          base: { root: { display: 'flex' }, label: { color: 'red' } },
        });
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { parts } from './parts';
        export const styles = parts.raw({});
        export const cls = css({ color: 'blue' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/parts.ts", recipe)]);

    assert!(output.changed);
    assert!(
        output.code.contains(r#""root":{"display":"flex"}"#),
        "{}",
        output.code
    );
}

#[test]
fn an_imported_recipe_raw_with_dynamic_props_keeps_the_call() {
    let button = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } } },
        });
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { button } from './button';
        export const styles = (size) => button.raw({ size });
        export const cls = css({ color: 'blue' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);

    assert!(output.code.contains("button.raw"), "{}", output.code);
    // The definition file precomputes its classes, so this returns a string at
    // runtime. Warn rather than fail silently.
    let warning = output
        .diagnostics
        .iter()
        .find(|diagnostic| diagnostic.code == "imported_recipe_raw_dynamic")
        .expect("diagnostic");
    assert!(
        warning.message.contains("statically known variants"),
        "{}",
        warning.message
    );
}

#[test]
fn a_static_imported_raw_call_does_not_warn() {
    let button = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } } },
        });
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { button } from './button';
        export const cls = css(button.raw({ size: 'sm' }));
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);

    assert!(
        !output
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == "imported_recipe_raw_dynamic"),
        "{:?}",
        output.diagnostics
    );
}

#[test]
fn a_dynamic_raw_on_a_non_recipe_import_does_not_warn() {
    let helpers = indoc! {r#"
        export const helper = { raw: (props) => props };
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { helper } from './helpers';
        export const styles = (size) => helper.raw({ size });
        export const cls = css({ color: 'blue' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/helpers.ts", helpers)]);

    assert!(
        !output
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == "imported_recipe_raw_dynamic"),
        "{:?}",
        output.diagnostics
    );
}

#[test]
fn an_imported_plain_object_is_unaffected() {
    let tokens = indoc! {r#"
        export const raw = { color: 'red' };
    "#};
    let source = indoc! {r#"
        import { css } from '@panda/css';
        import { raw } from './tokens';
        export const cls = css(raw);
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/tokens.ts", tokens)]);

    assert!(output.changed, "{}", output.code);
}

#[test]
fn a_file_with_no_panda_import_is_still_skipped() {
    // Extraction skips files that import nothing from Panda, so an imported
    // recipe's `.raw` can't be folded there. Documents the boundary.
    let button = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ base: { color: 'red' } });
    "#};
    let source = indoc! {r#"
        import { button } from './button';
        export const styles = button.raw({});
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);

    assert!(!output.changed, "{}", output.code);
}

#[test]
fn folds_a_raw_call_with_no_arguments() {
    // The shape the changeset documents: `.raw()` with nothing passed resolves
    // to the recipe's base styles, not to a class string.
    let source = indoc! {r#"
        import { css, cva } from '@panda/css';
        const button = cva({ base: { color: 'red' } });
        export const cls = css(button.raw(), { color: 'blue' });
    "#};
    assert_snapshot!(transform("src/styles.tsx", source).code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { css } from '@panda/css';
    const button = __pcva({ base: 'color_red' });
    export const cls = css({"color":"red"}, { color: 'blue' });
    "#);
}

#[test]
fn folds_a_raw_call_with_no_arguments_on_a_recipe_with_defaults() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '20px' } } },
          defaultVariants: { size: 'lg' },
        });
        export const styles = button.raw();
    "#};
    let output = transform("src/styles.tsx", source);
    assert!(
        output.code.contains(r#""fontSize":"20px""#),
        "default variant should be applied: {}",
        output.code
    );
}
