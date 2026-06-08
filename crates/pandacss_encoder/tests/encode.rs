//! Atomic encoder tests — walks a style object / recipe and verifies
//! the emitted atoms.

use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_encoder::{Atom, ConditionSet, Encoder};
use pandacss_extractor::{ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use pandacss_recipes::{Recipe, SlotRecipe};

fn css_matchers() -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        ..Default::default()
    }
}

fn first_arg(source: &str, name: &str) -> pandacss_extractor::Literal {
    let result = extract(source, "fixture.tsx", &ExtractorConfig::new(css_matchers()));
    result
        .calls
        .iter()
        .find(|c| c.name == name)
        .and_then(|c| c.data[0].clone())
        .expect("call with first arg")
}

/// Atoms in deterministic order. The encoder stores in an `FxHashSet`
/// so iteration order is unstable across runs; sort by
/// `(prop, conditions, value)` for snapshot stability.
fn sorted(atoms: &rustc_hash::FxHashSet<Atom>) -> Vec<&Atom> {
    let mut out: Vec<_> = atoms.iter().collect();
    out.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| a.conditions().cmp(b.conditions()))
            .then_with(|| format!("{:?}", a.value()).cmp(&format!("{:?}", b.value())))
    });
    out
}

fn encoder(names: &'static [&'static str]) -> Encoder<ConditionSet> {
    Encoder::with_conditions(ConditionSet::from_names(names.iter().copied()))
}

const STANDARD_CONDITIONS: &[&str] = &["base", "sm", "md", "lg", "xl", "2xl"];

fn encoder_with(extra: &'static [&'static str]) -> Encoder<ConditionSet> {
    let mut names = STANDARD_CONDITIONS.to_vec();
    names.extend(extra);
    Encoder::with_conditions(ConditionSet::from_names(names))
}

#[test]
fn flat_style_object_emits_one_atom_per_property() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: 'red', padding: '4px' });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

#[test]
fn nested_condition_creates_condition_chain() {
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: { base: 'red', _hover: 'blue', md: 'green' } });
        "},
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    // `base` drops from the condition chain (it's the unconditional
    // fallback); `_hover` and `md` stay.
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: red
      conditions: []
    - prop: color
      value: blue
      conditions:
        - _hover
    - prop: color
      value: green
      conditions:
        - md
    ");
}

#[test]
fn important_string_values_are_structural_metadata() {
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({
              color: 'red !important',
              background: 'blue!',
              _hover: { borderColor: 'green !IMPORTANT' },
            });
        "},
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: background
      value: blue
      conditions: []
      important: true
    - prop: borderColor
      value: green
      conditions:
        - _hover
      important: true
    - prop: color
      value: red
      conditions: []
      important: true
    ");
}

#[test]
fn absolute_url_string_values_are_skipped() {
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({
              color: 'red',
              backgroundImage: 'https://example.com/bg.png',
              maskImage: 'http://example.com/mask.svg',
            });
        "},
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn deeply_nested_conditions_stack_in_order() {
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: { _hover: { md: 'blue' } } });
        "},
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions:
        - _hover
        - md
    ");
}

// --- SmallVec inline-budget smoke tests (heap spill, not semantic limits) ---

#[test]
fn long_condition_chain_spills_past_inline_budget() {
    // `INLINE_CONDS = 2` — four stacked conditions must still encode correctly.
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: { _hover: { md: { lg: { xl: 'red' } } } } });
        "},
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);

    let atoms = sorted(encoder.atoms());
    assert_eq!(atoms.len(), 1);
    assert_eq!(atoms[0].conditions().len(), 4);

    assert_yaml_snapshot!(atoms, @r"
    - prop: color
      value: red
      conditions:
        - _hover
        - md
        - lg
        - xl
    ");
}

#[test]
fn deep_walk_path_spills_past_inline_budget() {
    // `INLINE_PATH = 8` — nine nested condition layers on the walk path must
    // still reach the leaf and emit one atom.
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({
              color: {
                d1: { d2: { d3: { d4: { d5: { d6: { d7: { d8: { d9: 'red' } } } } } } } },
              },
            });
        "},
        "css",
    );
    let mut encoder = encoder_with(&["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9"]);
    encoder.process_atomic(&lit);

    let atoms = sorted(encoder.atoms());
    assert_eq!(atoms.len(), 1);
    assert_eq!(atoms[0].conditions().len(), 9);

    assert_yaml_snapshot!(atoms, @r"
    - prop: color
      value: red
      conditions:
        - d1
        - d2
        - d3
        - d4
        - d5
        - d6
        - d7
        - d8
        - d9
    ");
}

#[test]
fn dedup_keeps_only_one_atom_for_repeated_pairs() {
    // Behavioral assertion: feed the same object three times, get
    // the same two atoms — set dedup at work. No need for the full
    // shape snapshot here; the count is the contract.
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: 'red', padding: '4px' });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    encoder.process_atomic(&lit);
    encoder.process_atomic(&lit);
    assert_eq!(encoder.atoms().len(), 2);
}

// --- recipe processing ---

#[test]
fn process_atomic_recipe_emits_base_plus_variants_plus_compound() {
    let lit = first_arg(
        indoc! {r"
            import { cva } from '@panda/css';
            cva({
              base: { color: 'white' },
              variants: {
                size: { sm: { fontSize: 12 }, lg: { fontSize: 16 } },
              },
              compoundVariants: [
                { size: 'sm', css: { fontWeight: 'bold' } },
              ],
            });
        "},
        "cva",
    );
    let recipe = Recipe::from_literal(&lit).expect("Recipe");
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic_recipe(&recipe);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r#"
    - prop: color
      value: white
      conditions: []
    - prop: fontSize
      value: "12"
      conditions: []
    - prop: fontSize
      value: "16"
      conditions: []
    - prop: fontWeight
      value: bold
      conditions: []
    "#);
}

#[test]
fn process_atomic_slot_recipe_emits_atoms_across_slots() {
    let lit = first_arg(
        indoc! {r"
            import { sva } from '@panda/css';
            sva({
              slots: ['root', 'icon'],
              base: { root: { padding: '8px' }, icon: { width: 16 } },
              variants: {
                size: {
                  sm: { root: { padding: '4px' } },
                },
              },
            });
        "},
        "sva",
    );
    let recipe = SlotRecipe::from_literal(&lit).expect("SlotRecipe");
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic_slot_recipe(&recipe);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r#"
    - prop: padding
      value: 4px
      conditions: []
    - prop: padding
      value: 8px
      conditions: []
    - prop: width
      value: "16"
      conditions: []
    "#);
}

// --- custom condition matcher ---

#[test]
fn custom_condition_matcher_recognizes_named_conditions() {
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: { small: 'red', medium: 'blue' } });
        "},
        "css",
    );
    let mut encoder = encoder(&["base", "small", "medium"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions:
        - medium
    - prop: color
      value: red
      conditions:
        - small
    ");
}

#[test]
fn raw_selector_and_at_rule_keys_are_conditions() {
    let lit = first_arg(
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: { '&:hover': { '@media (hover: hover)': 'red' } } });
        "},
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r#"
    - prop: color
      value: red
      conditions:
        - "&:hover"
        - "@media (hover: hover)"
    "#);
}

// --- composite leaf values ---

#[test]
fn array_value_serializes_as_joined_repr() {
    // Responsive arrays serialize to `[a,b,c]` for v1 — emitter can
    // expand per-breakpoint later.
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: ['red', 'blue', 'green'] });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r#"
    - prop: color
      value: "[red,blue,green]"
      conditions: []
    "#);
}

#[test]
fn unresolved_underscore_condition_emits_nothing() {
    // `_hovr` (typo for `_hover`) is `_`-prefixed but not a known condition,
    // so it's an unresolved condition reference — emit no atom.
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ _hovr: { color: 'red' } });",
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @"[]");
}

#[test]
fn unresolved_underscore_condition_nested_under_property_emits_nothing() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: { _hovr: 'red' } });",
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @"[]");
}

#[test]
fn known_underscore_condition_still_emits() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ _hover: { color: 'red' } });",
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: red
      conditions:
        - _hover
    ");
}

#[test]
fn custom_property_names_are_unaffected() {
    // `--foo` starts with `-`, not `_`, so it's a real custom property.
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ '--foo': 'red' });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r#"
    - prop: "--foo"
      value: red
      conditions: []
    "#);
}

#[test]
fn value_level_conditional_expands_both_branches() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: cond ? 'red' : 'blue' });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn nested_conditional_expands_every_branch() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: a ? 'red' : (b ? 'green' : 'blue') });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: green
      conditions: []
    - prop: color
      value: red
      conditions: []
    ");
}

#[test]
fn conditional_under_a_condition_keeps_the_condition_on_both_branches() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ _hover: { color: cond ? 'red' : 'blue' } });",
        "css",
    );
    let mut encoder = encoder_with(&["_hover"]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions:
        - _hover
    - prop: color
      value: red
      conditions:
        - _hover
    ");
}

#[test]
fn conditional_branch_important_is_preserved() {
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: cond ? 'red !important' : 'blue' });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic(&lit);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
      important: true
    ");
}

#[test]
fn fused_walker_also_expands_conditionals() {
    use pandacss_encoder::NoNormalize;
    let lit = first_arg(
        "import { css } from '@panda/css';\ncss({ color: cond ? 'red' : 'blue' });",
        "css",
    );
    let mut encoder = encoder_with(&[]);
    encoder.process_atomic_with(&lit, &NoNormalize);
    assert_yaml_snapshot!(sorted(encoder.atoms()), @r"
    - prop: color
      value: blue
      conditions: []
    - prop: color
      value: red
      conditions: []
    ");
}
