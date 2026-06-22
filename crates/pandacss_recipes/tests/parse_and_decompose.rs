//! `Recipe` / `SlotRecipe` parsing + atomic decomposition.
//!
//! Fixtures mirror real-world `cva` / `sva` shapes from the JS
//! reference — `packages/parser/__tests__/*.test.ts` plus the panda
//! preset configs.

use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use pandacss_recipes::{Recipe, SlotRecipe};

fn cva_matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        ..Default::default()
    }
}

/// Parse the first `cva(...)` call's argument and turn it into a
/// typed `Recipe`. Compact helper so each test focuses on the recipe
/// shape, not the extractor wiring.
fn parse_recipe(source: &str) -> Recipe {
    let result = extract(source, "fixture.tsx", &ExtractorConfig::new(cva_matchers()));
    let arg = result
        .calls
        .iter()
        .find(|c| c.name == "cva")
        .expect("cva call")
        .data[0]
        .as_ref()
        .expect("cva argument");
    Recipe::from_literal(arg).expect("Recipe::from_literal")
}

fn parse_slot_recipe(source: &str) -> SlotRecipe {
    let result = extract(source, "fixture.tsx", &ExtractorConfig::new(cva_matchers()));
    let arg = result
        .calls
        .iter()
        .find(|c| c.name == "sva")
        .expect("sva call")
        .data[0]
        .as_ref()
        .expect("sva argument");
    SlotRecipe::from_literal(arg).expect("SlotRecipe::from_literal")
}

// --- Recipe parsing ---

#[test]
fn parses_full_cva_shape() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({
          base: { color: 'white', padding: '4px' },
          variants: {
            size: {
              sm: { fontSize: 12 },
              lg: { fontSize: 16 },
            },
            intent: {
              danger: { background: 'red' },
              safe: { background: 'green' },
            },
          },
          compoundVariants: [
            { size: 'sm', intent: 'danger', css: { fontWeight: 'bold' } },
          ],
          defaultVariants: { size: 'sm', intent: 'safe' },
        });
    "};
    assert_yaml_snapshot!(parse_recipe(src), @r"
    base:
      color: white
      padding: 4px
    variants:
      - name: size
        options:
          - key: sm
            style:
              fontSize: 12
          - key: lg
            style:
              fontSize: 16
      - name: intent
        options:
          - key: danger
            style:
              background: red
          - key: safe
            style:
              background: green
    compoundVariants:
      - conditions:
          - - size
            - - sm
          - - intent
            - - danger
        css:
          fontWeight: bold
    defaultVariants:
      - - size
        - sm
      - - intent
        - safe
    ");
}

#[test]
fn parses_minimal_cva_with_only_base() {
    // Some recipes use `cva()` purely for atomic-style emission with
    // no variants. The parser tolerates the partial shape.
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({ base: { color: 'red' } });
    "};
    assert_yaml_snapshot!(parse_recipe(src), @r"
    base:
      color: red
    ");
}

#[test]
fn unknown_keys_are_ignored() {
    // `description`, `className`, future fields — we ignore them so
    // adding new config keys doesn't break parsing. Behavioral
    // assertion: only `base` survives, nothing else leaked through.
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({
          base: { color: 'red' },
          description: 'a button',
          className: 'btn',
        });
    "};
    let recipe = parse_recipe(src);
    assert!(recipe.base.is_some());
    assert!(recipe.variants.is_empty());
    assert!(recipe.compound_variants.is_empty());
    assert!(recipe.default_variants.is_empty());
}

#[test]
fn malformed_variants_dont_block_parsing() {
    // `variants` value isn't an object → empty variants; the recipe
    // still parses with whatever fields did fold. Behavioral
    // assertion: base survives, variants don't.
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({ base: { color: 'red' }, variants: 'invalid' });
    "};
    let recipe = parse_recipe(src);
    assert!(recipe.base.is_some());
    assert!(recipe.variants.is_empty());
}

// --- atomic decomposition ---

#[test]
fn atomic_styles_returns_base_plus_variant_plus_compound() {
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({
          base: { color: 'white' },
          variants: {
            size: { sm: { fontSize: 12 }, lg: { fontSize: 16 } },
          },
          compoundVariants: [
            { size: 'sm', css: { fontWeight: 'bold' } },
          ],
        });
    "};
    let recipe = parse_recipe(src);
    let styles: Vec<_> = recipe.atomic_styles().collect();
    assert_yaml_snapshot!(styles, @r"
    - color: white
    - fontSize: 12
    - fontSize: 16
    - fontWeight: bold
    ");
}

#[test]
fn atomic_styles_with_no_base_skips_base_entry() {
    // Just a count check — the *absence* of a base entry is the
    // assertion, not the shape of the surviving variant style.
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({
          variants: { size: { sm: { fontSize: 12 } } },
        });
    "};
    let recipe = parse_recipe(src);
    assert!(recipe.base.is_none());
    assert_eq!(recipe.atomic_styles().count(), 1);
}

// --- SlotRecipe parsing ---

#[test]
fn parses_sva_with_explicit_slots() {
    let src = indoc! {r"
        import { sva } from '@panda/css';
        const card = sva({
          slots: ['root', 'header', 'body'],
          base: {
            root: { padding: '8px' },
            header: { fontWeight: 'bold' },
          },
          variants: {
            size: {
              sm: {
                root: { padding: '4px' },
                header: { fontSize: 12 },
              },
              lg: {
                root: { padding: '16px' },
                header: { fontSize: 20 },
              },
            },
          },
        });
    "};
    assert_yaml_snapshot!(parse_slot_recipe(src), @r"
    slots:
      - root
      - header
      - body
    base:
      - - root
        - padding: 8px
      - - header
        - fontWeight: bold
    variants:
      - name: size
        options:
          - key: sm
            styles:
              - - root
                - padding: 4px
              - - header
                - fontSize: 12
          - key: lg
            styles:
              - - root
                - padding: 16px
              - - header
                - fontSize: 20
    ");
}

#[test]
fn sva_with_missing_slots_infers_from_base_and_variants() {
    // No `slots` key at all — `infer_slots` collects every slot name
    // that appears anywhere in `base` or variant option styles.
    // First-seen ordering matters here, so the asserted list is the
    // contract.
    let src = indoc! {r"
        import { sva } from '@panda/css';
        const card = sva({
          base: {
            root: { padding: '8px' },
            header: { fontWeight: 'bold' },
          },
          variants: {
            size: {
              sm: {
                root: { padding: '4px' },
                footer: { fontSize: 10 },
              },
            },
          },
        });
    "};
    let recipe = parse_slot_recipe(src);
    assert_eq!(recipe.slots, vec!["root", "header", "footer"]);
}

#[test]
fn sva_with_missing_slots_infers_compound_variant_only_slots() {
    // No `slots` key, and `footer` appears *only* inside a compoundVariant's
    // `css`. `infer_slots` must still collect it (matches JS `inferSlots`),
    // appended after base/variant slots in first-seen order.
    let src = indoc! {r"
        import { sva } from '@panda/css';
        const card = sva({
          base: {
            root: { padding: '8px' },
          },
          variants: {
            size: { sm: { header: { fontSize: 12 } } },
          },
          compoundVariants: [
            { size: 'sm', css: { footer: { fontSize: 10 } } },
          ],
        });
    "};
    let recipe = parse_slot_recipe(src);
    assert_eq!(recipe.slots, vec!["root", "header", "footer"]);
}

#[test]
fn sva_compound_variant_targets_slot_specific_css() {
    let src = indoc! {r"
        import { sva } from '@panda/css';
        const card = sva({
          slots: ['root', 'header'],
          variants: {
            size: { sm: { root: { padding: '4px' } } },
          },
          compoundVariants: [
            { size: 'sm', css: { root: { border: '1px solid' }, header: { fontSize: 11 } } },
          ],
        });
    "};
    let recipe = parse_slot_recipe(src);
    assert_yaml_snapshot!(recipe.compound_variants, @r"
    - conditions:
        - - size
          - - sm
      css:
        - - root
          - border: 1px solid
        - - header
          - fontSize: 11
    ");
}

#[test]
fn sva_atomic_styles_per_slot_groups_by_slot_in_declaration_order() {
    let src = indoc! {r"
        import { sva } from '@panda/css';
        const card = sva({
          slots: ['root', 'header'],
          base: { root: { padding: '8px' }, header: { fontWeight: 'bold' } },
          variants: {
            size: {
              sm: { root: { padding: '4px' } },
              lg: { root: { padding: '16px' }, header: { fontSize: 20 } },
            },
          },
        });
    "};
    let recipe = parse_slot_recipe(src);
    let materialized: Vec<(String, Vec<&pandacss_extractor::Literal>)> = recipe
        .atomic_styles_per_slot()
        .map(|(slot, iter)| (slot.to_owned(), iter.collect()))
        .collect();
    assert_yaml_snapshot!(materialized, @r"
    - - root
      - - padding: 8px
        - padding: 4px
        - padding: 16px
    - - header
      - - fontWeight: bold
        - fontSize: 20
    ");
}

#[test]
fn sva_drops_slot_styles_that_arent_in_declared_slots_list() {
    // Defensive: a typo'd slot key in a variant option won't appear
    // in the per-slot output because it isn't in `slots`. The
    // assertion is "only the declared slot survives" — a count is
    // clearer than a shape snapshot for that.
    let src = indoc! {r"
        import { sva } from '@panda/css';
        const card = sva({
          slots: ['root'],
          base: { root: { padding: '8px' } },
          variants: {
            size: {
              sm: { roott: { padding: '4px' } },
            },
          },
        });
    "};
    let recipe = parse_slot_recipe(src);
    let per_slot: Vec<(&str, usize)> = recipe
        .atomic_styles_per_slot()
        .map(|(slot, iter)| (slot, iter.count()))
        .collect();
    assert_eq!(per_slot, vec![("root", 1)]);
}

// --- end-to-end: real cva fixture ---

#[test]
fn parses_button_recipe_with_variant_values_as_objects() {
    // Real-world panda recipe shape — each variant option is itself a
    // nested object (responsive condition keys), not just primitives.
    let src = indoc! {r"
        import { cva } from '@panda/css';
        const button = cva({
          base: {
            display: 'inline-flex',
            alignItems: 'center',
          },
          variants: {
            intent: {
              primary: { background: 'blue.500', color: 'white' },
              secondary: { background: 'gray.200', color: 'black' },
            },
          },
        });
    "};
    assert_yaml_snapshot!(parse_recipe(src), @r"
    base:
      display: inline-flex
      alignItems: center
    variants:
      - name: intent
        options:
          - key: primary
            style:
              background: blue.500
              color: white
          - key: secondary
            style:
              background: gray.200
              color: black
    ");
}
