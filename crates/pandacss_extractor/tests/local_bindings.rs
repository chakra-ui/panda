//! Local call-binding facts for transform (`extract_for_transform` only).

use crate::common::panda_config;
use indoc::indoc;
use pandacss_extractor::{ExpressionKind, LocalDeclarationKind, extract, extract_for_transform};

#[test]
fn collects_plain_calls_for_cva_binding() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' }, variants: { on: { true: { opacity: '0.5' } } } })
        export const a = recipe({ on: x })
        export const b = recipe()
    "};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());
    assert_eq!(result.module.local_call_bindings.len(), 1);
    let binding = &result.module.local_call_bindings[0];
    assert_eq!(binding.local, "recipe");
    assert_eq!(binding.declaration, LocalDeclarationKind::Const);
    assert!(!binding.has_other_references);
    assert_eq!(binding.calls.len(), 2);
    assert_eq!(binding.init_span, result.calls[0].span);
    assert_eq!(binding.calls[0].args.len(), 1);
    let arg = binding.calls[0].args[0].as_ref().expect("object arg");
    assert_eq!(arg.kind, ExpressionKind::Object);
    assert_eq!(binding.calls[1].args.len(), 0);
}

#[test]
fn shadowed_binding_is_not_collected_as_call() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' } })
        function f(recipe) {
          return recipe({ color: 'blue' })
        }
    "};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());
    let binding = result
        .module
        .local_call_bindings
        .iter()
        .find(|b| b.local == "recipe")
        .expect("outer binding");
    assert!(binding.calls.is_empty());
    assert!(!binding.has_other_references);
}

#[test]
fn rename_marks_other_references() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' } })
        const other = recipe
        export const cls = other({})
    "};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());
    let binding = result
        .module
        .local_call_bindings
        .iter()
        .find(|b| b.local == "recipe")
        .expect("binding");
    assert!(binding.calls.is_empty());
    assert!(binding.has_other_references);
}

#[test]
fn member_raw_call_is_other_reference() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' } })
        export const raw = recipe.raw({ color: 'blue' })
        export const cls = recipe({})
    "};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());
    let binding = result
        .module
        .local_call_bindings
        .iter()
        .find(|b| b.local == "recipe")
        .expect("binding");
    assert_eq!(binding.calls.len(), 1);
    assert!(binding.has_other_references);
}

#[test]
fn mutated_let_binding_is_skipped() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        let recipe = cva({ base: { color: 'red' } })
        recipe = cva({ base: { color: 'blue' } })
        export const cls = recipe({})
    "};
    let result = extract_for_transform(source, "fixture.tsx", &panda_config());
    assert!(
        result
            .module
            .local_call_bindings
            .iter()
            .all(|b| b.local != "recipe")
    );
}

#[test]
fn extract_hot_path_keeps_local_bindings_empty() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' } })
        export const cls = recipe({})
    "};
    let result = extract(source, "fixture.tsx", &panda_config());
    assert!(result.module.local_call_bindings.is_empty());
}

#[test]
fn collects_raw_calls_on_a_local_cva_binding() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const a = styles.raw({ size: 'sm' });
        export const b = styles({ size: 'lg' });
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert_eq!(binding.local, "styles");
    assert_eq!(binding.calls.len(), 1, "plain call");
    assert_eq!(binding.raw_calls.len(), 1, "raw call");
    assert_eq!(binding.raw_calls[0].args.len(), 1);
    assert!(
        binding.has_other_references,
        ".raw still counts as a non-plain reference"
    );
}

#[test]
fn a_bare_raw_reference_is_not_a_raw_call() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const fn = styles.raw;
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(binding.raw_calls.is_empty());
    assert!(
        binding.has_opaque_raw_access,
        "the function escapes as a value"
    );
    assert!(binding.has_other_references);
}

#[test]
fn a_non_raw_member_call_is_not_a_raw_call() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const keys = styles.splitVariantProps({ size: 'sm' });
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(binding.raw_calls.is_empty());
    assert!(binding.has_other_references);
}

#[test]
fn an_optional_chained_raw_call_is_opaque() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles?.raw({});
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(binding.raw_calls.is_empty());
    assert!(binding.has_opaque_raw_access);
}

#[test]
fn raw_passed_as_a_value_is_opaque() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = [].map(styles.raw);
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(binding.raw_calls.is_empty());
    assert!(binding.has_opaque_raw_access);
}

#[test]
fn a_direct_raw_call_is_not_opaque() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles.raw({ size: 'sm' });
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert_eq!(binding.raw_calls.len(), 1);
    assert!(!binding.has_opaque_raw_access);
}

#[test]
fn a_non_raw_member_access_is_not_opaque_raw() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const keys = styles.variantKeys;
    "};

    let result = extract_for_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(!binding.has_opaque_raw_access);
    assert!(binding.has_other_references);
}
