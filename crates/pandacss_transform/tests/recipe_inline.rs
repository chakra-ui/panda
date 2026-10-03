//! Inline `cva()` / `sva()` call transforms.

use super::common::{project_with_jsx, project_with_jsx_and, transform, transform_with_project};
use indoc::indoc;
use insta::{assert_snapshot, assert_yaml_snapshot};
use pandacss_transform::{TransformOptions, TransformOutput, TransformTargets, transform_source};
use serde_json::json;

#[test]
fn rewrites_inline_cva_to_a_specialized_function() {
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
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'md' : _p0; return __pcx('background-color_blue color_red', { sm: "fs_12px", md: "fs_16px" }[v0]); }, {
      base: { color: 'red', backgroundColor: 'blue' },
      variants: {
        size: {
          sm: { fontSize: '12px' },
          md: { fontSize: '16px' },
        },
      },
      defaultVariants: { size: 'md' },
    }, ["size"], { size: ["sm", "md"] });
    "#);
}

#[test]
fn rewrites_inline_sva_to_a_specialized_function() {
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
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: __pcx("d_flex", { sm: "fs_12px" }[v0]), trigger: __pcx("cursor_pointer", { sm: "fs_12px" }[v0]) }; }, {
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
    }, ["size"], { size: ["sm"] }, {});
    "#);
}

#[test]
fn rewrites_inline_sva_with_slots_declared_as_const() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        const slots = ['root', 'trigger'] as const;
        export const tabs = sva({
          slots,
          base: {
            root: { display: 'flex' },
            trigger: { cursor: 'pointer' },
          },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    const slots = ['root', 'trigger'] as const;
    export const tabs = /* @__PURE__ */ __pr((p = {}) => ({ root: "d_flex", trigger: "cursor_pointer" }), {
      slots,
      base: {
        root: { display: 'flex' },
        trigger: { cursor: 'pointer' },
      },
    }, [], {}, {});
    "#);
}

#[test]
fn specializes_sva_class_names_without_a_recipe_runtime() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          className: 'tabs',
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => ({ root: "tabs__root", trigger: "tabs__trigger" }), {
      slots: ['root', 'trigger'],
      className: 'tabs',
    }, [], {}, { root: "tabs__root", trigger: "tabs__trigger" });
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
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; const _p1 = p["intent"], v1 = _p1 === void 0 ? 'danger' : _p1; return __pcx('color_white', { sm: "fs_12px" }[v0], { danger: "background-color_red" }[v1], v0 === 'sm' && v1 === 'danger' && "color_black"); }, {
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
    }, ["size", "intent"], { size: ["sm"], intent: ["danger"] });
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
fn rewrites_sva_variants_per_slot_when_slots_differ() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const card = sva({
          slots: ['root', 'header', 'body'],
          base: { root: { display: 'grid' } },
          variants: {
            size: {
              sm: { root: { padding: '4px' }, header: { fontSize: '12px' } },
              lg: { root: { padding: '16px' }, header: { fontSize: '20px' }, body: { gap: '8px' } },
            },
          },
          defaultVariants: { size: 'lg' },
          compoundVariants: [{ size: 'sm', css: { body: { display: 'none' } } }],
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const card = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'lg' : _p0; return { root: __pcx("d_grid", { sm: "padding_4px", lg: "padding_16px" }[v0]), header: ({ sm: "fs_12px", lg: "fs_20px" }[v0]) || '', body: __pcx({ lg: "gap_8px" }[v0], v0 === 'sm' && "d_none") }; }, {
      slots: ['root', 'header', 'body'],
      base: { root: { display: 'grid' } },
      variants: {
        size: {
          sm: { root: { padding: '4px' }, header: { fontSize: '12px' } },
          lg: { root: { padding: '16px' }, header: { fontSize: '20px' }, body: { gap: '8px' } },
        },
      },
      defaultVariants: { size: 'lg' },
      compoundVariants: [{ size: 'sm', css: { body: { display: 'none' } } }],
    }, ["size"], { size: ["sm", "lg"] }, {});
    "#);
}

#[test]
fn keeps_an_sva_variant_off_the_slots_it_does_not_style() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          variants: { size: { sm: { root: { fontSize: '12px' } } } },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: ({ sm: "fs_12px" }[v0]) || '', trigger: '' }; }, {
      slots: ['root', 'trigger'],
      variants: { size: { sm: { root: { fontSize: '12px' } } } },
    }, ["size"], { size: ["sm"] }, {});
    "#);
}

#[test]
fn rewrites_sva_boolean_variant_that_styles_one_slot() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          variants: {
            fitted: {
              true: { trigger: { flex: '1' } },
              false: { trigger: { flex: 'none' } },
            },
          },
          defaultVariants: { fitted: true },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["fitted"], v0 = _p0 === void 0 ? true : _p0; return { root: '', trigger: ({ true: "flex_1", false: "flex_none" }[v0]) || '' }; }, {
      slots: ['root', 'trigger'],
      variants: {
        fitted: {
          true: { trigger: { flex: '1' } },
          false: { trigger: { flex: 'none' } },
        },
      },
      defaultVariants: { fitted: true },
    }, ["fitted"], { fitted: ["true", "false"] }, {});
    "#);
}

#[test]
fn rewrites_sva_boolean_variant_shared_by_every_slot() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const card = sva({
          slots: ['root', 'title'],
          variants: { muted: { true: { root: { opacity: '0.5' }, title: { opacity: '0.5' } } } },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const card = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["muted"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: ({ true: "opacity_0.5" }[v0]) || '', title: ({ true: "opacity_0.5" }[v0]) || '' }; }, {
      slots: ['root', 'title'],
      variants: { muted: { true: { root: { opacity: '0.5' }, title: { opacity: '0.5' } } } },
    }, ["muted"], { muted: ["true"] }, {});
    "#);
}

#[test]
fn rewrites_sva_boolean_compound_condition_as_a_boolean() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          variants: {
            size: { sm: { root: { gap: '4px' } } },
            fitted: { true: { trigger: { flex: '1' } } },
          },
          compoundVariants: [{ size: 'sm', fitted: true, css: { trigger: { padding: '0' } } }],
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; const _p1 = p["fitted"], v1 = _p1 === void 0 ? void 0 : _p1; return { root: ({ sm: "gap_4px" }[v0]) || '', trigger: __pcx({ true: "flex_1" }[v1], v0 === 'sm' && v1 === true && "padding_0") }; }, {
      slots: ['root', 'trigger'],
      variants: {
        size: { sm: { root: { gap: '4px' } } },
        fitted: { true: { trigger: { flex: '1' } } },
      },
      compoundVariants: [{ size: 'sm', fitted: true, css: { trigger: { padding: '0' } } }],
    }, ["size", "fitted"], { size: ["sm"], fitted: ["true"] }, {});
    "#);
}

#[test]
fn rewrites_cva_boolean_compound_condition_as_a_boolean() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          variants: {
            size: { sm: { fontSize: '12px' } },
            block: { true: { display: 'flex' } },
          },
          compoundVariants: [{ size: 'sm', block: true, css: { padding: '0' } }],
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; const _p1 = p["block"], v1 = _p1 === void 0 ? void 0 : _p1; return __pcx({ sm: "fs_12px" }[v0], { true: "d_flex" }[v1], v0 === 'sm' && v1 === true && "padding_0"); }, {
      variants: {
        size: { sm: { fontSize: '12px' } },
        block: { true: { display: 'flex' } },
      },
      compoundVariants: [{ size: 'sm', block: true, css: { padding: '0' } }],
    }, ["size", "block"], { size: ["sm"], block: ["true"] });
    "#);
}

#[test]
fn compares_numeric_and_string_compound_values_as_written() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const grid = cva({
          variants: {
            cols: { 1: { padding: '1px' }, 2: { padding: '2px' } },
            dense: { true: { margin: '0' } },
          },
          compoundVariants: [
            { cols: 2, css: { color: 'red' } },
            { cols: '1', dense: 'true', css: { color: 'blue' } },
          ],
          defaultVariants: { cols: 2 },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const grid = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["cols"], v0 = _p0 === void 0 ? 2 : _p0; const _p1 = p["dense"], v1 = _p1 === void 0 ? void 0 : _p1; return __pcx({ '1': "padding_1px", '2': "padding_2px" }[v0], { true: "margin_0" }[v1], v0 === 2 && "color_red", v0 === '1' && v1 === 'true' && "color_blue"); }, {
      variants: {
        cols: { 1: { padding: '1px' }, 2: { padding: '2px' } },
        dense: { true: { margin: '0' } },
      },
      compoundVariants: [
        { cols: 2, css: { color: 'red' } },
        { cols: '1', dense: 'true', css: { color: 'blue' } },
      ],
      defaultVariants: { cols: 2 },
    }, ["cols", "dense"], { cols: ["1", "2"], dense: ["true"] });
    "#);
}

#[test]
fn rewrites_sva_responsive_slot_styles_to_conditional_classes() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          variants: { size: { sm: { root: { fontSize: { base: '12px', md: '14px' } } } } },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: ({ sm: "fs_12px md:fs_14px" }[v0]) || '', trigger: '' }; }, {
      slots: ['root', 'trigger'],
      variants: { size: { sm: { root: { fontSize: { base: '12px', md: '14px' } } } } },
    }, ["size"], { size: ["sm"] }, {});
    "#);
}

#[test]
fn derives_sva_slots_from_base_when_slots_is_omitted() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const card = sva({
          base: { root: { display: 'grid' }, title: { fontWeight: '700' } },
          variants: {
            muted: { true: { root: { opacity: '0.5' }, title: { opacity: '0.5' } } },
            size: { sm: { title: { fontSize: '12px' } } },
          },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const card = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["muted"], v0 = _p0 === void 0 ? void 0 : _p0; const _p1 = p["size"], v1 = _p1 === void 0 ? void 0 : _p1; return { root: __pcx("d_grid", { true: "opacity_0.5" }[v0]), title: __pcx("font-weight_700", { true: "opacity_0.5" }[v0], { sm: "fs_12px" }[v1]) }; }, {
      base: { root: { display: 'grid' }, title: { fontWeight: '700' } },
      variants: {
        muted: { true: { root: { opacity: '0.5' }, title: { opacity: '0.5' } } },
        size: { sm: { title: { fontSize: '12px' } } },
      },
    }, ["muted", "size"], { muted: ["true"], size: ["sm"] }, {});
    "#);
}

#[test]
fn encodes_an_sva_option_with_no_styles_as_an_empty_map() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger'],
          variants: { size: { sm: { root: { gap: '4px' } }, md: {} } },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: ({ sm: "gap_4px" }[v0]) || '', trigger: '' }; }, {
      slots: ['root', 'trigger'],
      variants: { size: { sm: { root: { gap: '4px' } }, md: {} } },
    }, ["size"], { size: ["sm", "md"] }, {});
    "#);
}

#[test]
fn quotes_sva_slot_names_that_are_not_identifiers() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        export const field = sva({
          slots: ['root', 'helper-text'],
          base: { 'helper-text': { fontSize: '12px' } },
          variants: { invalid: { true: { 'helper-text': { color: 'red' } } } },
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    export const field = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["invalid"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: '', 'helper-text': __pcx("fs_12px", { true: "color_red" }[v0]) }; }, {
      slots: ['root', 'helper-text'],
      base: { 'helper-text': { fontSize: '12px' } },
      variants: { invalid: { true: { 'helper-text': { color: 'red' } } } },
    }, ["invalid"], { invalid: ["true"] }, {});
    "#);
}

#[test]
fn leaves_a_styled_recipe_config_to_styled_system_and_marks_the_call_pure() {
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
    assert!(!output.helper.needs_attach_recipe);
    assert!(!output.helper.needs_cx);
    assert_snapshot!(output.code, @"
    import { styled } from '@panda/jsx';
    export const Card = /* @__PURE__ */ styled('div', {
      base: { color: 'red', padding: '8px' },
      variants: {
        size: {
          sm: { fontSize: '12px' },
          md: { fontSize: '16px' },
        },
      },
      defaultVariants: { size: 'md' },
    });
    ");
}

#[test]
fn marks_an_aliased_styled_factory_pure_from_its_callee_shape() {
    let source = indoc! {r#"
        import { styled as s } from '@panda/jsx';
        export const Card = s('div', { color: 'red' });
    "#};

    let output = transform_with_project(&project_with_jsx(), "src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @"
    import { styled as s } from '@panda/jsx';
    export const Card = /* @__PURE__ */ s('div', { color: 'red' });
    ");
}

#[test]
fn injects_cx_and_the_recipe_surface_when_cva_and_sva_are_specialized() {
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
    assert!(output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    export const el = <div className={__pcx(props.className, isError ? "color_red" : "color_blue")} />;
    export const button = /* @__PURE__ */ __pr((p = {}) => 'color_blue', { base: { color: 'blue' } }, [], {});
    export const tabs = /* @__PURE__ */ __pr((p = {}) => ({ root: "d_flex" }), { base: { root: { display: 'flex' } } }, [], {}, {});
    export const Card = /* @__PURE__ */ styled('div', { color: 'green' });
    "#);
}

#[test]
fn rewrites_cva_base_with_property_conditional() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ base: { color: cond ? 'red' : 'blue' } });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => cond ? "color_red" : "color_blue", { base: { color: cond ? 'red' : 'blue' } }, [], {});
    "#);
}

#[test]
fn exported_single_fragment_cva_and_sva_skip_cx() {
    let source = indoc! {r#"
        import { cva, sva } from '@panda/css';
        export const button = cva({ base: { color: 'red' } });
        export const tabs = sva({ base: { root: { display: 'flex' } } });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.changed);
    assert!(!output.helper.needs_cx);
    assert!(output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => 'color_red', { base: { color: 'red' } }, [], {});
    export const tabs = /* @__PURE__ */ __pr((p = {}) => ({ root: "d_flex" }), { base: { root: { display: 'flex' } } }, [], {}, {});
    "#);
}

#[test]
fn specializes_a_local_boolean_cva_to_a_cx_function() {
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
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
    const recipe = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["r0"], v0 = _p0 === void 0 ? true : _p0; const _p1 = p["r1"], v1 = _p1 === void 0 ? void 0 : _p1; return __pcx('d_inline-flex', { true: "opacity_0.5" }[v0], { true: "fs_12px" }[v1]); }, { r0: ["true"], r1: ["true"] });
    export const cls = recipe({
      r0: !active,
      r1: variant === 'secondary' || variant === 'outline',
    });
    export const baseOnly = recipe();
    "#);
}

#[test]
fn specializes_a_local_string_variant_cva() {
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
    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
    const button = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "fs_12px", md: "fs_16px" }[v0]); }, { size: ["sm", "md"] });
    export const cls = button({ size: 'sm' });
    "#);
}

#[test]
fn specializes_local_cva_compounds_and_array_conditions() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({
          variants: {
            size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' } },
            tone: { danger: { color: 'red' } },
          },
          compoundVariants: [
            { size: ['sm', 'md'], tone: 'danger', css: { fontWeight: 'bold' } },
          ],
        });
        export const cls = button({ size, tone });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
    const button = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; const _p1 = p["tone"], v1 = _p1 === void 0 ? void 0 : _p1; return __pcx({ sm: "fs_12px", md: "fs_16px" }[v0], { danger: "color_red" }[v1], (v0 === 'sm' || v0 === 'md') && v1 === 'danger' && "font-weight_bold"); }, { size: ["sm", "md"], tone: ["danger"] }, 1);
    export const cls = button({ size, tone });
    "#);
}

#[test]
fn specializes_a_local_sva_per_slot() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        const tabs = sva({
          slots: ['root', 'trigger'],
          className: 'tabs',
          base: { root: { display: 'flex' }, trigger: { cursor: 'pointer' } },
          variants: {
            size: {
              sm: { root: { gap: '4px' } },
              lg: { root: { gap: '8px' }, trigger: { fontSize: '16px' } },
            },
          },
          defaultVariants: { size: 'sm' },
          compoundVariants: [{ size: 'lg', css: { trigger: { fontWeight: 'bold' } } }],
        });
        export const classes = tabs({ size });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.helper.needs_cx);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
    const tabs = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; return { root: __pcx("d_flex", "tabs__root", { sm: "gap_4px", lg: "gap_8px" }[v0]), trigger: __pcx("cursor_pointer", "tabs__trigger", { lg: "fs_16px" }[v0], v0 === 'lg' && "font-weight_bold") }; }, { size: ["sm", "lg"] }, 1);
    export const classes = tabs({ size });
    "#);
}

#[test]
fn specializes_an_sva_class_name_prefix_without_a_runtime_helper() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        const tabs = sva({ className: 'tabs', slots: ['root', 'trigger'] });
        export const classes = tabs();
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(!output.helper.needs_cx);
    assert!(!output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @r#"
    const tabs = (p = {}) => ({ root: "tabs__root", trigger: "tabs__trigger" });
    export const classes = tabs();
    "#);
}

#[test]
fn specializes_an_escaped_local_recipe_without_a_recipe_runtime() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({ base: { color: 'red' } });
        consume(button);
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    const button = /* @__PURE__ */ __pr((p = {}) => 'color_red', { base: { color: 'red' } }, [], {});
    consume(button);
    ");
}

#[test]
fn attaches_the_lightweight_cva_surface_when_observed() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({
          variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
          defaultVariants: { size: 'sm' },
        });
        export const meta = [button.__cva__, button.variantKeys, button.variantMap, button.config];
        export const selected = button.getVariantProps({ size: undefined, id: 'save' });
        export const split = button.splitVariantProps({ size: 'lg', id: 'save' });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @r#"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    const button = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; return ({ sm: "fs_12px", lg: "fs_16px" }[v0]) || ''; }, {
      variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
      defaultVariants: { size: 'sm' },
    }, ["size"], { size: ["sm", "lg"] });
    export const meta = [button.__cva__, button.variantKeys, button.variantMap, button.config];
    export const selected = button.getVariantProps({ size: undefined, id: 'save' });
    export const split = button.splitVariantProps({ size: 'lg', id: 'save' });
    "#);
}

#[test]
fn attaches_the_lightweight_sva_surface_when_observed() {
    let source = indoc! {r#"
        import { sva } from '@panda/css';
        const tabs = sva({
          slots: ['root', 'trigger'],
          className: 'tabs',
          variants: { size: { sm: { root: { fontSize: '12px' } } } },
        });
        export const meta = [tabs.__cva__, tabs.variantKeys, tabs.variantMap, tabs.classNameMap, tabs.config];
        export const selected = tabs.getVariantProps({ size: 'sm' });
        export const split = tabs.splitVariantProps({ size: 'sm', id: 'tabs' });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, attachRecipe as __pr } from '@pandacss-internal/css';
    const tabs = /* @__PURE__ */ __pr((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return { root: __pcx("tabs__root", { sm: "fs_12px" }[v0]), trigger: "tabs__trigger" }; }, {
      slots: ['root', 'trigger'],
      className: 'tabs',
      variants: { size: { sm: { root: { fontSize: '12px' } } } },
    }, ["size"], { size: ["sm"] }, { root: "tabs__root", trigger: "tabs__trigger" });
    export const meta = [tabs.__cva__, tabs.variantKeys, tabs.variantMap, tabs.classNameMap, tabs.config];
    export const selected = tabs.getVariantProps({ size: 'sm' });
    export const split = tabs.splitVariantProps({ size: 'sm', id: 'tabs' });
    "#);
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
    const styles = (p = {}) => 'color_red';
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; return __pcx('color_red', { sm: "padding_4px", lg: "padding_8px" }[v0]); };
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; return __pcx('color_red', { sm: "padding_4px", lg: "padding_8px" }[v0]); };
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px" }[v0]); };
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; const _p1 = p["tone"], v1 = _p1 === void 0 ? void 0 : _p1; return __pcx('color_red', { sm: "padding_4px" }[v0], { a: "color_blue" }[v1], v0 === 'sm' && v1 === 'a' && "margin_2px"); };
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; const _p1 = p["tone"], v1 = _p1 === void 0 ? void 0 : _p1; return __pcx('color_red', { sm: "padding_4px" }[v0], { a: "color_blue" }[v1], v0 === 'sm' && v1 === 'a' && "margin_2px"); };
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["on"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { true: "opacity_0.5" }[v0]); };
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
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; return { root: __pcx("color_red", { sm: "padding_4px" }[v0]), icon: "padding_1px" }; };
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
    import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
    const styles = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px" }[v0]); }, { size: ["sm"] });
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
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; const _p1 = p["tone"], v1 = _p1 === void 0 ? void 0 : _p1; return { root: __pcx("color_red", { sm: "padding_4px", lg: "padding_8px" }[v0], { a: "color_blue" }[v1], v0 === 'sm' && v1 === 'a' && "outline_1px"), icon: __pcx("padding_1px", { lg: "margin_2px" }[v0], v0 === 'sm' && v1 === 'a' && "border_9px", v0 === 'lg' && "border_3px") }; };
    export const out = {"root":{"color":"red","padding":"4px"},"icon":{"padding":"1px"}};
    "#);
}

#[test]
fn folds_sva_raw_applying_a_matching_compound_variant_to_every_slot() {
    let output = transform(
        "src/a.tsx",
        sva_compound_source!("{ size: 'sm', tone: 'a' }"),
    );

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; const _p1 = p["tone"], v1 = _p1 === void 0 ? void 0 : _p1; return { root: __pcx("color_red", { sm: "padding_4px", lg: "padding_8px" }[v0], { a: "color_blue" }[v1], v0 === 'sm' && v1 === 'a' && "outline_1px"), icon: __pcx("padding_1px", { lg: "margin_2px" }[v0], v0 === 'sm' && v1 === 'a' && "border_9px", v0 === 'lg' && "border_3px") }; };
    export const out = {"root":{"color":"blue","padding":"4px","outline":"1px"},"icon":{"padding":"1px","border":"9px"}};
    "#);
}

#[test]
fn folds_sva_raw_when_a_compound_variant_touches_one_slot_only() {
    let output = transform("src/a.tsx", sva_compound_source!("{ size: 'lg' }"));

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'sm' : _p0; const _p1 = p["tone"], v1 = _p1 === void 0 ? void 0 : _p1; return { root: __pcx("color_red", { sm: "padding_4px", lg: "padding_8px" }[v0], { a: "color_blue" }[v1], v0 === 'sm' && v1 === 'a' && "outline_1px"), icon: __pcx("padding_1px", { lg: "margin_2px" }[v0], v0 === 'sm' && v1 === 'a' && "border_9px", v0 === 'lg' && "border_3px") }; };
    export const out = {"root":{"color":"red","padding":"8px"},"icon":{"padding":"1px","margin":"2px","border":"3px"}};
    "#);
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

fn fold_raw(source: &str) -> TransformOutput {
    let output = transform("src/a.tsx", source);

    assert!(output.changed);
    output
}

#[test]
fn folds_cva_raw_with_the_first_value_of_an_array_compound_condition() {
    let output = fold_raw(cva_array_compound_source!("{ size: 'sm' }"));
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px", md: "padding_6px", lg: "padding_8px" }[v0], (v0 === 'sm' || v0 === 'md') && "margin_2px"); };
    export const out = {"color":"red","padding":"4px","margin":"2px"};
    "#);
}

#[test]
fn folds_cva_raw_with_a_later_value_of_an_array_compound_condition() {
    let output = fold_raw(cva_array_compound_source!("{ size: 'md' }"));
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px", md: "padding_6px", lg: "padding_8px" }[v0], (v0 === 'sm' || v0 === 'md') && "margin_2px"); };
    export const out = {"color":"red","padding":"6px","margin":"2px"};
    "#);
}

#[test]
fn folds_cva_raw_skipping_an_array_compound_condition_that_excludes_the_value() {
    let output = fold_raw(cva_array_compound_source!("{ size: 'lg' }"));
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px", md: "padding_6px", lg: "padding_8px" }[v0], (v0 === 'sm' || v0 === 'md') && "margin_2px"); };
    export const out = {"color":"red","padding":"8px"};
    "#);
}

#[test]
fn folds_cva_raw_when_a_compound_condition_names_an_unselected_variant() {
    let output = fold_raw(cva_array_compound_source!("{}"));
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px", md: "padding_6px", lg: "padding_8px" }[v0], (v0 === 'sm' || v0 === 'md') && "margin_2px"); };
    export const out = {"color":"red"};
    "#);
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
    assert_snapshot!(output.code, @r#"
    const styles = (p = {}) => 'color_red';
    export function f() { return {"color":"red"}; }
    "#);
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
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const styles = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "padding_4px" }[v0]); };
    export const a = {"color":"red","padding":"4px"};
    export const b = {"color":"red"};
    "#);
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
    assert_snapshot!(output.code, @"
    const styles = (p = {}) => 'color_red';
    export function f(styles) { return styles.raw({}); }
    ");
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
    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const cls = "color_blue padding_8px";
    "#);
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
    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const styles = {"color":"red","padding":"4px"};
    export const cls = "color_blue";
    "#);
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
    assert_snapshot!(output.code, @r#"
    import { parts } from './parts';
    export const styles = {"root":{"display":"flex"},"label":{"color":"red"}};
    export const cls = "color_blue";
    "#);
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

    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const styles = (size) => button.raw({ size });
    export const cls = "color_blue";
    "#);
    // The definition file precomputes its classes, so this returns a string at
    // runtime. Warn rather than fail silently.
    let warning = output
        .diagnostics
        .iter()
        .find(|diagnostic| diagnostic.code == "imported_recipe_raw_dynamic")
        .expect("diagnostic");
    assert_snapshot!(warning.message, @"`button.raw(...)` needs statically known variants because `button` is defined in another file. It will return a class string, not a style object. Pass literal variant values, or move the composition into the file that defines `button`.");
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
fn folds_a_raw_call_with_no_arguments() {
    // The shape the changeset documents: `.raw()` with nothing passed resolves
    // to the recipe's base styles, not to a class string.
    let source = indoc! {r#"
        import { css, cva } from '@panda/css';
        const button = cva({ base: { color: 'red' } });
        export const cls = css(button.raw(), { color: 'blue' });
    "#};
    assert_snapshot!(transform("src/styles.tsx", source).code, @r#"
    import { css } from '@panda/css';
    const button = (p = {}) => 'color_red';
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
    assert_snapshot!(output.code, @r#"
    import { cx as __pcx } from '@pandacss-internal/css';
    const button = (p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? 'lg' : _p0; return __pcx('color_red', { sm: "fs_12px", lg: "fs_20px" }[v0]); };
    export const styles = {"color":"red","fontSize":"20px"};
    "#);
}

// --- a consumer that imports the recipe but nothing from Panda ---

#[test]
fn folds_a_raw_call_in_a_file_that_imports_no_panda_api() {
    // The component only imports the recipe. Panda skips files with no Panda
    // imports, which is exactly how this call used to survive unfolded — and
    // the desugared definition's `raw` hands back a class string.
    let source = indoc! {r#"
        import { button } from './recipes';
        export const styles = button.raw({ size: 'sm' });
    "#};
    let recipes = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { fontSize: '12px' } } },
        });
    "#};

    let output =
        super::common::transform_cross_file("main.tsx", source, &[("recipes.ts", recipes)]);

    assert!(output.changed, "the raw call should fold: {}", output.code);
    assert_snapshot!(output.code, @r#"
    import { button } from './recipes';
    export const styles = {"color":"red","fontSize":"12px"};
    "#);
}

#[test]
fn leaves_a_file_with_no_panda_api_and_no_raw_call_alone() {
    // The fast path that skips unrelated files has to survive.
    let source = indoc! {r#"
        import { helper } from './helper';
        export const value = helper(1);
    "#};
    let helper = indoc! {r#"
        export const helper = (n) => n + 1;
    "#};

    let output = super::common::transform_cross_file("main.tsx", source, &[("helper.ts", helper)]);

    assert!(
        !output.changed,
        "unrelated file should be untouched: {}",
        output.code
    );
}

#[test]
fn parenthesizes_an_imported_raw_result_after_an_arrow_body_comment() {
    let button = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ base: { color: 'red' } });
    "#};
    let source = indoc! {r#"
        import { button } from './button';
        export const styles = () => /* object */ button.raw({});
    "#};
    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);
    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const styles = () => /* object */ ({"color":"red"});
    "#);
}

#[test]
fn leaves_cva_and_sva_on_the_runtime_with_hashed_class_names() {
    let source = indoc! {r#"
        import { cva, sva } from '@panda/css';
        import { styled } from '@panda/jsx';
        export const button = cva({
          base: { color: 'red' },
          variants: { size: { sm: { fontSize: '12px' } } },
        });
        export const tabs = sva({ slots: ['root'], base: { root: { display: 'flex' } } });
        export const Card = styled('div', { base: { color: 'blue' } });
        export const styles = button.raw({ size: 'sm' });
    "#};

    let output = transform_with_project(
        &project_with_jsx_and(json!({ "hash": true })),
        "src/recipes.tsx",
        source,
    );

    assert!(!output.helper.needs_attach_recipe);
    assert_snapshot!(output.code, @"
    import { cva, sva } from '@panda/css';
    import { styled } from '@panda/jsx';
    export const button = cva({
      base: { color: 'red' },
      variants: { size: { sm: { fontSize: '12px' } } },
    });
    export const tabs = sva({ slots: ['root'], base: { root: { display: 'flex' } } });
    export const Card = /* @__PURE__ */ styled('div', { base: { color: 'blue' } });
    export const styles = button.raw({ size: 'sm' });
    ");
    assert_yaml_snapshot!(output.diagnostics, @r#"
    - code: transform_hashed_recipe_skipped
      message: "Class names are hashed, so `cva` and `sva` recipes in this file weren't transformed and run at runtime instead. Other styles may not transform as expected either."
      severity: warning
      file: src/recipes.tsx
      span:
        start: 98
        end: 184
    "#);
}

#[test]
fn still_transforms_plain_css_with_hashed_class_names() {
    let source = indoc! {r#"
        import { css, cva } from '@panda/css';
        export const cls = css({ color: 'red' });
        export const button = cva({ base: { color: 'red' } });
    "#};

    let output = transform_with_project(
        &project_with_jsx_and(json!({ "hash": { "className": true, "cssVar": false } })),
        "src/recipes.ts",
        source,
    );

    assert_eq!(output.diagnostics.len(), 1);
    assert_snapshot!(output.code, @r#"
    import { cva } from '@panda/css';
    export const cls = "hihALq";
    export const button = cva({ base: { color: 'red' } });
    "#);
}

#[test]
fn specializes_cva_when_only_css_variables_are_hashed() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ base: { color: 'red' } });
    "#};

    let output = transform_with_project(
        &project_with_jsx_and(json!({ "hash": { "className": false, "cssVar": true } })),
        "src/recipes.ts",
        source,
    );

    assert!(output.helper.needs_attach_recipe);
    assert!(output.diagnostics.is_empty());
    assert_snapshot!(output.code, @"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => 'color_red', { base: { color: 'red' } }, [], {});
    ");
}

#[test]
fn specializes_cva_in_a_project_without_utilities() {
    let config: pandacss_config::UserConfig = serde_json::from_value(json!({
        "outdir": "styled-system",
        "importMap": { "css": ["@panda/css"] },
    }))
    .expect("valid config");
    let project =
        pandacss_project::Project::new(pandacss_system::System::new(config).expect("config"));
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ base: { color: 'red' } });
    "#};

    let output = transform_with_project(&project, "src/recipes.ts", source);

    assert_snapshot!(output.code, @"
    import { attachRecipe as __pr } from '@pandacss-internal/css';
    export const button = /* @__PURE__ */ __pr((p = {}) => 'color_red', { base: { color: 'red' } }, [], {});
    ");
}

#[test]
fn memoizes_a_call_only_local_recipe_through_the_helper() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({ variants: { size: { sm: { color: 'red' } } } });
        export const cls = button({ size: 'sm' });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(output.helper.needs_memo_recipe);
    assert!(!output.helper.needs_attach_recipe);
}

#[test]
fn leaves_memoization_of_an_exported_recipe_to_attach_recipe() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({ variants: { size: { sm: { color: 'red' } } } });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(!output.helper.needs_memo_recipe);
    assert!(output.helper.needs_attach_recipe);
}

#[test]
fn does_not_memoize_a_recipe_without_variants() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        const button = cva({ base: { color: 'red' } });
        export const cls = button();
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(!output.helper.needs_memo_recipe);
    assert_snapshot!(output.code, @"
    const button = (p = {}) => 'color_red';
    export const cls = button();
    ");
}

#[test]
fn keeps_a_recipe_whose_compound_selects_an_undeclared_prop_on_the_runtime() {
    let source = indoc! {r#"
        import { cva } from '@panda/css';
        export const button = cva({
          variants: { size: { sm: { color: 'red' } } },
          compoundVariants: [{ size: 'sm', disabled: true, css: { opacity: '0.5' } }],
        });
    "#};

    let output = transform("src/recipes.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

const IMPORTED_BUTTON: &str = indoc! {r#"
    import { cva } from '@panda/css';
    export const button = cva({
      base: { color: 'red', padding: '2px' },
      variants: { size: { sm: { padding: '4px' }, lg: { padding: '8px' } } },
      compoundVariants: [{ size: 'lg', css: { fontSize: '20px' } }],
      defaultVariants: { size: 'sm' },
    });
"#};

#[test]
fn folds_a_static_call_on_an_imported_cva_to_its_classes() {
    let source = indoc! {r#"
        import { button } from './button';
        export const large = button({ size: 'lg' });
        export const fallback = button();
    "#};

    let output = super::common::transform_cross_file(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON)],
    );

    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const large = "color_red padding_8px fs_20px";
    export const fallback = "color_red padding_4px";
    "#);
    assert_yaml_snapshot!(output.dependencies, @"- /proj/src/button.ts");
}

#[test]
fn does_not_fold_an_imported_cva_when_the_css_target_is_disabled() {
    let source =
        "import { button } from './button';\nexport const large = button({ size: 'lg' });\n";
    let project = super::common::project_with_files(
        "src/a.ts",
        source,
        &[("src/button.ts", IMPORTED_BUTTON)],
    );
    let output = transform_source(
        project.system(),
        "/proj/src/a.ts",
        source,
        &TransformOptions {
            targets: TransformTargets {
                css: false,
                patterns: false,
                recipes: true,
                tokens: false,
                jsx: false,
            },
            ..TransformOptions::default()
        },
    );

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn keeps_an_imported_cva_call_at_runtime_with_hashed_class_names() {
    let source =
        "import { button } from './button';\nexport const large = button({ size: 'lg' });\n";
    let project = super::common::project_with_files_and(
        "src/a.ts",
        source,
        &[("src/button.ts", IMPORTED_BUTTON)],
        json!({ "hash": true }),
    );
    let output = transform_with_project(&project, "/proj/src/a.ts", source);

    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn keeps_a_dynamic_call_on_an_imported_cva() {
    let source = indoc! {r#"
        import { button } from './button';
        export const cls = (size) => button({ size });
    "#};

    let output = super::common::transform_cross_file(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON)],
    );

    assert!(!output.changed);
    assert!(output.diagnostics.is_empty());
}

#[test]
fn hoists_a_static_call_on_an_imported_sva_to_one_slot_object() {
    let tabs = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({
          slots: ['root', 'trigger', 'indicator'],
          className: 'tabs',
          base: { root: { display: 'flex' }, trigger: { color: 'red' } },
          variants: { size: { sm: { trigger: { padding: '4px' } }, lg: { trigger: { padding: '8px' } } } },
          defaultVariants: { size: 'sm' },
        });
    "#};
    let source = indoc! {r#"
        import { tabs } from './tabs';
        export function Tabs() {
          const classes = tabs({ size: 'lg' });
          const again = tabs({ size: 'lg' });
          return [classes, again, tabs()];
        }
    "#};

    let output = super::common::transform_cross_file("src/a.tsx", source, &[("src/tabs.ts", tabs)]);

    assert_snapshot!(output.code, @r#"
    const __ps0 = { root: "d_flex tabs__root", trigger: "color_red padding_8px tabs__trigger", indicator: "tabs__indicator" };
    const __ps1 = { root: "d_flex tabs__root", trigger: "color_red padding_4px tabs__trigger", indicator: "tabs__indicator" };
    import { tabs } from './tabs';
    export function Tabs() {
      const classes = __ps0;
      const again = __ps0;
      return [classes, again, __ps1];
    }
    "#);
}

#[test]
fn derives_imported_sva_slots_from_base_when_slots_is_omitted() {
    let card = indoc! {r#"
        import { sva } from '@panda/css';
        export const card = sva({ base: { root: { display: 'grid' }, title: { color: 'red' } } });
    "#};
    let source = indoc! {r#"
        import { card } from './card';
        export const classes = card();
    "#};

    let output = super::common::transform_cross_file("src/a.tsx", source, &[("src/card.ts", card)]);

    assert_snapshot!(output.code, @r#"
    const __ps0 = { root: "d_grid", title: "color_red" };
    import { card } from './card';
    export const classes = __ps0;
    "#);
}

#[test]
fn keeps_a_dynamic_call_on_an_imported_sva() {
    let tabs = indoc! {r#"
        import { sva } from '@panda/css';
        export const tabs = sva({ slots: ['root'], base: { root: { color: 'red' } } });
    "#};
    let source = indoc! {r#"
        import { tabs } from './tabs';
        export const classes = (props) => tabs(props);
    "#};

    let output = super::common::transform_cross_file("src/a.tsx", source, &[("src/tabs.ts", tabs)]);

    assert!(!output.changed);
}

#[test]
fn leaves_a_call_on_an_imported_plain_function_alone() {
    let helper = "export const format = (value) => String(value);\n";
    let source = indoc! {r#"
        import { format } from './format';
        export const text = format({ size: 'lg' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/format.ts", helper)]);

    assert!(!output.changed);
}

#[test]
fn folds_imported_recipe_calls_in_a_project_with_a_jsx_framework() {
    let source = indoc! {r#"
        import { button } from './button';
        export const large = button({ size: 'lg' });
        export const styles = button.raw({ size: 'lg' });
    "#};
    let project = super::common::project_with_files_and(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON)],
        json!({ "jsxFramework": "react" }),
    );

    let output = transform_with_project(&project, "/proj/src/a.tsx", source);

    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const large = "color_red padding_8px fs_20px";
    export const styles = {"color":"red","padding":"8px","fontSize":"20px"};
    "#);
}

#[test]
fn folds_calls_on_a_recipe_re_exported_by_name() {
    let index = "export { button } from './button';\n";
    let source = indoc! {r#"
        import { button } from './index';
        export const large = button({ size: 'lg' });
        export const styles = button.raw({ size: 'lg' });
    "#};

    let output = super::common::transform_cross_file(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON), ("src/index.ts", index)],
    );

    assert_snapshot!(output.code, @r#"
    import { button } from './index';
    export const large = "color_red padding_8px fs_20px";
    export const styles = {"color":"red","padding":"8px","fontSize":"20px"};
    "#);
}

#[test]
fn folds_calls_on_a_recipe_re_exported_through_export_star() {
    let index = "export * from './button';\n";
    let source = indoc! {r#"
        import { button } from './index';
        export const large = button({ size: 'lg' });
    "#};

    let output = super::common::transform_cross_file(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON), ("src/index.ts", index)],
    );

    assert_snapshot!(output.code, @r#"
    import { button } from './index';
    export const large = "color_red padding_8px fs_20px";
    "#);
}

#[test]
fn folds_calls_on_a_recipe_re_exported_under_another_name() {
    let index = "export { button as primaryButton } from './button';\n";
    let source = indoc! {r#"
        import { primaryButton } from './index';
        export const large = primaryButton({ size: 'lg' });
    "#};

    let output = super::common::transform_cross_file(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON), ("src/index.ts", index)],
    );

    assert_snapshot!(output.code, @r#"
    import { primaryButton } from './index';
    export const large = "color_red padding_8px fs_20px";
    "#);
}

#[test]
fn specializes_a_recipe_built_with_an_aliased_cva_import() {
    let source = indoc! {r#"
        import { cva as recipe } from '@panda/css';
        const button = recipe({
          base: { color: 'red' },
          variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
        });
        export const classes = (props) => button(props);
    "#};

    let output = transform("src/button.ts", source);

    assert_snapshot!(output.code, @r#"
    import { cx as __pcx, memoRecipe as __pm } from '@pandacss-internal/css';
    const button = /* @__PURE__ */ __pm((p = {}) => { p ??= {}; const _p0 = p["size"], v0 = _p0 === void 0 ? void 0 : _p0; return __pcx('color_red', { sm: "fs_12px", lg: "fs_16px" }[v0]); }, { size: ["sm", "lg"] });
    export const classes = (props) => button(props);
    "#);
}

#[test]
fn folds_calls_on_an_imported_recipe_built_with_an_aliased_cva_import() {
    let button = indoc! {r#"
        import { cva as recipe } from '@panda/css';
        export const button = recipe({
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' }, lg: { padding: '8px' } } },
        });
    "#};
    let source = indoc! {r#"
        import { button } from './button';
        export const large = button({ size: 'lg' });
    "#};

    let output =
        super::common::transform_cross_file("src/a.tsx", source, &[("src/button.ts", button)]);

    assert_snapshot!(output.code, @r#"
    import { button } from './button';
    export const large = "color_red padding_8px";
    "#);
}

#[test]
fn folds_calls_on_an_imported_recipe_exported_again() {
    let index = "import { button } from './button';\nexport { button };\n";
    let source = indoc! {r#"
        import { button } from './index';
        export const large = button({ size: 'lg' });
    "#};

    let output = super::common::transform_cross_file(
        "src/a.tsx",
        source,
        &[("src/button.ts", IMPORTED_BUTTON), ("src/index.ts", index)],
    );

    assert_snapshot!(output.code, @r#"
    import { button } from './index';
    export const large = "color_red padding_8px fs_20px";
    "#);
}
