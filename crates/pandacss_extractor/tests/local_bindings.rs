//! Local call-binding facts for transform (`extract_transform` only).

use crate::common::panda_config;
use indoc::indoc;
use insta::assert_snapshot;
use pandacss_extractor::{ExpressionKind, LocalDeclarationKind, extract, extract_transform};

#[test]
fn collects_each_call_of_a_local_cva_recipe() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' }, variants: { on: { true: { opacity: '0.5' } } } })
        export const a = recipe({ on: x })
        export const b = recipe()
    "};
    let result = extract_transform(source, "fixture.tsx", &panda_config());
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
    let result = extract_transform(source, "fixture.tsx", &panda_config());
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
fn aliasing_a_local_cva_marks_other_references() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' } })
        const other = recipe
        export const cls = other({})
    "};
    let result = extract_transform(source, "fixture.tsx", &panda_config());
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
fn raw_call_on_a_local_cva_marks_other_references() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ base: { color: 'red' } })
        export const raw = recipe.raw({ color: 'blue' })
        export const cls = recipe({})
    "};
    let result = extract_transform(source, "fixture.tsx", &panda_config());
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
    let result = extract_transform(source, "fixture.tsx", &panda_config());
    assert!(
        result
            .module
            .local_call_bindings
            .iter()
            .all(|b| b.local != "recipe")
    );
}

#[test]
fn plain_extract_does_not_collect_local_bindings() {
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

    let result = extract_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert_eq!(binding.local, "styles");
    assert_eq!(binding.calls.len(), 1, "plain call");
    assert_eq!(binding.raw_calls.len(), 1, "raw call");
    assert_eq!(binding.raw_calls[0].args.len(), 1);
    assert!(
        binding.has_other_references,
        ".raw still counts as a non-plain reference"
    );
    assert!(
        !binding.has_non_call_references,
        "a direct raw call can be consumed before specialization"
    );
}

#[test]
fn a_bare_raw_reference_is_not_a_raw_call() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const fn = styles.raw;
    "};

    let result = extract_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(binding.raw_calls.is_empty());
    assert!(
        binding.has_opaque_raw_access,
        "the function escapes as a value"
    );
    assert!(binding.has_other_references);
    assert!(binding.has_non_call_references);
}

#[test]
fn a_non_raw_member_call_is_not_a_raw_call() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const keys = styles.splitVariantProps({ size: 'sm' });
    "};

    let result = extract_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(binding.raw_calls.is_empty());
    assert!(binding.has_other_references);
    assert!(binding.has_non_call_references);
}

#[test]
fn an_optional_chained_raw_call_is_opaque() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        export const out = styles?.raw({});
    "};

    let result = extract_transform(src, "fixture.tsx", &panda_config());
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

    let result = extract_transform(src, "fixture.tsx", &panda_config());
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

    let result = extract_transform(src, "fixture.tsx", &panda_config());
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

    let result = extract_transform(src, "fixture.tsx", &panda_config());
    let binding = &result.module.local_call_bindings[0];

    assert!(!binding.has_opaque_raw_access);
    assert!(binding.has_other_references);
    assert!(binding.has_non_call_references);
}

fn describe_bindings(source: &str) -> String {
    let result = extract_transform(source, "fixture.tsx", &panda_config());
    result
        .module
        .local_call_bindings
        .iter()
        .map(|binding| {
            let init = &source[binding.init_span.start as usize..binding.init_span.end as usize];
            format!(
                "{} = {init}\n  calls: {}, raw calls: {}, escapes: {}, other uses: {}",
                binding.local,
                binding.calls.len(),
                binding.raw_calls.len(),
                binding.has_non_call_references,
                binding.has_other_references,
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn collects_recipes_held_by_a_local_object() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = {
          root: cva({ base: { color: 'red' } }),
          label: cva({ variants: { on: { true: { opacity: '0.5' } } } }),
          plain: 'not-a-recipe',
        }
        export const a = styles.root()
        export const b = styles.label({ on: x })
        export const c = styles.label.raw({ on: true })
        export const d = styles.plain
    "};

    assert_snapshot!(describe_bindings(source), @"
    styles = cva({ base: { color: 'red' } })
      calls: 1, raw calls: 0, escapes: false, other uses: false
    styles = cva({ variants: { on: { true: { opacity: '0.5' } } } })
      calls: 1, raw calls: 1, escapes: false, other uses: true
    ");
}

#[test]
fn using_a_member_as_a_value_marks_only_that_member() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = {
          root: cva({ base: { color: 'red' } }),
          label: cva({ base: { color: 'blue' } }),
        }
        export const alias = styles.root
        export const cls = styles.label()
    "};

    assert_snapshot!(describe_bindings(source), @"
    styles = cva({ base: { color: 'red' } })
      calls: 0, raw calls: 0, escapes: true, other uses: true
    styles = cva({ base: { color: 'blue' } })
      calls: 1, raw calls: 0, escapes: false, other uses: false
    ");
}

#[test]
fn passing_the_object_around_marks_every_member() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = {
          root: cva({ base: { color: 'red' } }),
          label: cva({ base: { color: 'blue' } }),
        }
        export const cls = styles.root()
        register(styles)
    "};

    assert_snapshot!(describe_bindings(source), @"
    styles = cva({ base: { color: 'red' } })
      calls: 1, raw calls: 0, escapes: true, other uses: true
    styles = cva({ base: { color: 'blue' } })
      calls: 0, raw calls: 0, escapes: true, other uses: true
    ");
}

#[test]
fn optional_chaining_on_the_object_marks_every_member() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = {
          root: cva({ base: { color: 'red' } }),
          label: cva({ base: { color: 'blue' } }),
        }
        export const cls = styles.root()
        export const opt = styles?.label()
    "};

    assert_snapshot!(describe_bindings(source), @"
    styles = cva({ base: { color: 'red' } })
      calls: 1, raw calls: 0, escapes: true, other uses: true
    styles = cva({ base: { color: 'blue' } })
      calls: 0, raw calls: 0, escapes: true, other uses: true
    ");
}

#[test]
fn skips_an_object_with_a_spread() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = { root: cva({ base: { color: 'red' } }), ...other }
        export const cls = styles.root()
    "};

    assert_snapshot!(describe_bindings(source), @"");
}

#[test]
fn skips_an_object_with_a_computed_key() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = { root: cva({ base: { color: 'red' } }), [key]: 1 }
        export const cls = styles.root()
    "};

    assert_snapshot!(describe_bindings(source), @"");
}

#[test]
fn skips_an_object_with_a_repeated_key() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const styles = { root: cva({ base: { color: 'red' } }), root: 1 }
        export const cls = styles.root()
    "};

    assert_snapshot!(describe_bindings(source), @"");
}

#[test]
fn ignores_references_in_type_positions() {
    let source = indoc! {r"
        import { cva } from '@panda/css'
        const recipe = cva({ variants: { on: { true: { opacity: '0.5' } } } })
        const styles = { root: cva({ variants: { on: { true: { opacity: '0.5' } } } }) }
        type RecipeProps = Parameters<typeof recipe>[0]
        type RootProps = Parameters<typeof styles.root>[0]
        export const a = recipe({ on: true })
        export const b = styles.root({ on: true })
    "};

    assert_snapshot!(describe_bindings(source), @"
    recipe = cva({ variants: { on: { true: { opacity: '0.5' } } } })
      calls: 1, raw calls: 0, escapes: false, other uses: false
    styles = cva({ variants: { on: { true: { opacity: '0.5' } } } })
      calls: 1, raw calls: 0, escapes: false, other uses: false
    ");
}
