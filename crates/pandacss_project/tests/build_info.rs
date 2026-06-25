//! `Project::build_info` — condensed serialized encoder state with per-module
//! atom provenance, plus a serialize/deserialize round-trip.

use crate::common::{create_config, create_project, sorted_atoms};
use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_encoder::AtomValue;
use pandacss_project::{BuildInfo, BuildValue};
use serde_json::json;

#[test]
fn build_info_emits_interned_atoms_with_per_module_provenance() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', padding: '4px' });
        "},
    );
    project.parse_file(
        "card.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', margin: '8px' });
        "},
    );

    let info = project.build_info("^2.0.0".into());

    // `color: red` is shared, so it appears once in `atoms` and is referenced by
    // both modules; `padding`/`margin` are module-local.
    assert_yaml_snapshot!(info, @"
    schemaVersion: 3
    panda: ^2.0.0
    configFingerprint: cfg1-317514db4289aa4e
    strings:
      - color
      - red
      - margin
      - 8px
      - padding
      - 4px
    atoms:
      - p: 0
        v: 1
      - p: 2
        v: 3
      - p: 4
        v: 5
    modules:
      button.tsx:
        atoms:
          - 0
          - 2
      card.tsx:
        atoms:
          - 0
          - 1
    ");
}

#[test]
fn config_fingerprint_ignores_io_fields_but_tracks_output_config() {
    let base = create_project(json!({}));
    // Same engine config, only machine-local IO / codegen differs.
    let io_only = create_project(json!({ "outdir": "dist", "include": ["src/**/*.tsx"] }));
    // Output-affecting config (class-name hashing) differs.
    let hashed = create_project(json!({ "hash": true }));

    assert_eq!(base.config_fingerprint(), io_only.config_fingerprint());
    assert_ne!(base.config_fingerprint(), hashed.config_fingerprint());
    // Stable shape, so the artifact's `configFingerprint` is comparable across hosts.
    assert!(base.config_fingerprint().starts_with("cfg1-"));
}

#[test]
fn build_info_round_trips_through_json() {
    let mut project = create_project(json!({}));
    project.parse_file(
        "x.tsx",
        indoc! {r"
            import { css } from '@panda/css';
            css({ color: 'red', zIndex: 1, padding: '0', disabled: true });
        "},
    );

    let info = project.build_info("^2.0.0".into());
    let json = serde_json::to_string(&info).expect("serialize build info");
    let restored: BuildInfo = serde_json::from_str(&json).expect("deserialize build info");
    assert_eq!(info, restored);
}

#[test]
fn build_info_preserves_token_identity() {
    let mut project = create_project(json!({
        "theme": {
            "tokens": {
                "colors": {
                    "red": {
                        "500": { "value": "#ef4444" }
                    }
                }
            }
        }
    }));
    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css'; import { token } from '@panda/tokens'; css({ color: token('colors.red.500') });",
    );

    let info = project.build_info("^2.0.0".into());
    let atom = info.atoms.first().expect("token atom");
    let BuildValue::Token { t, v } = &atom.v else {
        panic!("expected token build value, got {:?}", atom.v);
    };
    assert_eq!(info.strings[*t as usize], "colors.red.500");
    assert_eq!(info.strings[*v as usize], "#ef4444");

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, None));
    let hydrated = sorted_atoms(&consumer);
    assert!(
        matches!(
            hydrated.first().map(|atom| atom.value()),
            Some(AtomValue::Token { path, value })
                if &**path == "colors.red.500" && &**value == "#ef4444"
        ),
        "expected hydrated token atom, got {hydrated:?}",
    );
}

fn lib_project() -> pandacss_project::Project {
    let mut project = create_project(json!({}));
    project.parse_file(
        "button.tsx",
        "import { css } from '@panda/css'; css({ color: 'red', padding: '4px' });",
    );
    project.parse_file(
        "card.tsx",
        "import { css } from '@panda/css'; css({ color: 'red', margin: '8px' });",
    );
    project
}

// --- Hydrate: atoms ---

#[test]
fn hydrate_reproduces_every_atom() {
    let source = lib_project();
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, None));

    assert_eq!(sorted_atoms(&consumer), sorted_atoms(&source));
}

#[test]
fn hydrate_with_module_filter_emits_only_imported_modules() {
    let source = lib_project();
    let info = source.build_info("^2.0.0".into());

    // Import only `button` — `card`'s `margin: 8px` must not hydrate.
    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, Some(&["button.tsx".into()])));

    assert_yaml_snapshot!(sorted_atoms(&consumer), @r"
    - prop: color
      value: red
      conditions: []
    - prop: padding
      value: 4px
      conditions: []
    ");
}

/// A library exposing a config recipe (`button`) and a slot recipe (`tabs`),
/// each used from a distinct module so recipe provenance is per-file.
fn recipe_lib_project() -> pandacss_project::Project {
    let mut project = create_project(json!({
        "theme": {
            "recipes": {
                "button": {
                    "base": { "display": "inline-flex" },
                    "variants": { "size": { "sm": { "fontSize": "12px" } } }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "slots": ["root"],
                    "variants": { "size": { "sm": { "root": { "gap": "4px" } } } }
                }
            }
        }
    }));
    project.parse_file(
        "button.tsx",
        "import { button } from '@panda/recipes'; button({ size: 'sm' });",
    );
    project.parse_file(
        "tabs.tsx",
        "import { tabs } from '@panda/recipes'; tabs({ size: 'sm' });",
    );
    project
}

/// The recipe snapshot the emitter actually consumes (own recipes + hydrated).
fn emit_recipes(project: &mut pandacss_project::Project) -> serde_json::Value {
    let config = create_config(json!({}));
    serde_json::to_value(project.stylesheet_snapshots(&config).encoded_recipes)
        .expect("serialize recipe snapshot")
}

// --- Hydrate: config + slot recipes ---

#[test]
fn build_info_serializes_recipes_with_per_module_provenance() {
    let source = recipe_lib_project();
    let info = source.build_info("^2.0.0".into());

    // `button` base+variant attribute to `button.tsx`; `tabs` variant to `tabs.tsx`.
    assert_yaml_snapshot!(info.recipes, @r"
    base:
      - r: 0
        cls: 0
        entries:
          - p: 1
            v: 2
    variants:
      - r: 0
        cls: 3
        entries:
          - p: 4
            v: 5
      - r: 6
        slot: 7
        cls: 8
        entries:
          - p: 9
            v: 10
    ");
    assert_yaml_snapshot!(info.modules, @r"
    button.tsx:
      recipes:
        - 0
        - 1
    tabs.tsx:
      recipes:
        - 2
    ");
}

/// Same two recipes as [`recipe_lib_project`], but each is consumed through
/// **JSX** — a config recipe component (`<Button>`) and a slot recipe member tag
/// (`<Tabs.Root>`) — so we prove JSX usage feeds per-module recipe provenance.
fn jsx_recipe_lib_project() -> pandacss_project::Project {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Button"],
                    "base": { "display": "inline-flex" },
                    "variants": { "size": { "sm": { "fontSize": "12px" } } }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "jsx": ["Tabs"],
                    "slots": ["root"],
                    "variants": { "size": { "sm": { "root": { "gap": "4px" } } } }
                }
            }
        }
    }));
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export const View = () => <Button size='sm' />;",
    );
    project.parse_file(
        "tabs.tsx",
        "import { Tabs } from './ui'; export const View = () => <Tabs.Root size='sm' />;",
    );
    project
}

#[test]
fn build_info_attributes_jsx_recipe_usage_to_its_module() {
    let source = jsx_recipe_lib_project();
    let info = source.build_info("^2.0.0".into());

    // `<Button>` → button base+variant in button.tsx; `<Tabs.Root>` → tabs in tabs.tsx.
    assert_yaml_snapshot!(info.modules, @r"
    button.tsx:
      recipes:
        - 0
        - 1
    tabs.tsx:
      recipes:
        - 2
    ");
}

#[test]
fn hydrate_reproduces_jsx_recipe_usage() {
    let mut source = jsx_recipe_lib_project();
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, None));
    assert_eq!(emit_recipes(&mut consumer), emit_recipes(&mut source));
}

#[test]
fn hydrate_with_module_filter_tree_shakes_jsx_recipes() {
    let source = jsx_recipe_lib_project();
    let info = source.build_info("^2.0.0".into());

    // Import only the `<Button>` module — the `<Tabs.Root>` slot recipe drops.
    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, Some(&["button.tsx".into()])));
    assert_yaml_snapshot!(emit_recipes(&mut consumer), @r"
    base:
      - recipe: button
        slot: ~
        className: button
        entries:
          - prop: display
            value: inline-flex
            conditions: []
    variants:
      - recipe: button
        slot: ~
        className: button--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic: []
    ");
}

#[test]
fn hydrate_reproduces_every_recipe() {
    let mut source = recipe_lib_project();
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, None));

    // The consumer owns no recipes, so its emit snapshot is exactly the lib's.
    assert_eq!(emit_recipes(&mut consumer), emit_recipes(&mut source));
}

#[test]
fn hydrate_with_module_filter_emits_only_imported_recipes() {
    let source = recipe_lib_project();
    let info = source.build_info("^2.0.0".into());

    // Import only `button` — the `tabs` slot recipe must not hydrate.
    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, Some(&["button.tsx".into()])));

    assert_yaml_snapshot!(emit_recipes(&mut consumer), @r"
    base:
      - recipe: button
        slot: ~
        className: button
        entries:
          - prop: display
            value: inline-flex
            conditions: []
    variants:
      - recipe: button
        slot: ~
        className: button--size_sm
        entries:
          - prop: fontSize
            value: 12px
            conditions: []
    atomic: []
    ");
}

#[test]
fn build_info_maps_exports_of_recipe_consuming_components() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Button"],
                    "base": { "display": "inline-flex" },
                    "variants": { "size": { "sm": { "fontSize": "12px" } } }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "jsx": ["Tabs"],
                    "slots": ["root"],
                    "variants": { "size": { "sm": { "root": { "gap": "4px" } } } }
                }
            }
        }
    }));
    // Components consuming a config recipe / slot recipe via JSX, exported by name.
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export function ActionButton() { return <Button size='sm' />; }",
    );
    project.parse_file(
        "tabs.tsx",
        "import { Tabs } from './ui'; export const TabBar = () => <Tabs.Root size='sm' />;",
    );
    // Exports something, but consumes no Panda styles — nothing to resolve to.
    project.parse_file("constants.tsx", "export const NOT_A_COMPONENT = 1;");

    let info = project.build_info("^2.0.0".into());

    // Each recipe-consuming component resolves to its own module; the styleless
    // module's export is omitted.
    assert_yaml_snapshot!(info.exports, @r"
    ActionButton: button.tsx
    TabBar: tabs.tsx
    ");
}

#[test]
fn build_info_tracks_named_specifier_exports() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": { "recipes": { "card": { "jsx": ["Card"], "base": { "padding": "4px" } } } }
    }));
    // `export { Local as Public }` — the exported (public) name is tracked.
    project.parse_file(
        "card.tsx",
        "import { Card } from './ui'; const CardImpl = () => <Card />; export { CardImpl as CardView };",
    );

    let info = project.build_info("^2.0.0".into());
    assert_eq!(
        info.exports.get("CardView").map(String::as_str),
        Some("card.tsx")
    );
    assert!(
        !info.exports.contains_key("CardImpl"),
        "the local name is not exported"
    );
}

fn jsx_button_project() -> pandacss_project::Project {
    create_project(json!({
        "jsxFramework": "react",
        "theme": { "recipes": { "button": { "jsx": ["Button"], "base": { "display": "inline-flex" } } } }
    }))
}

// --- Cross-file re-export resolution (barrel → styled module) ---

#[test]
fn build_info_resolves_named_re_exports() {
    // `index.ts` re-exports a styled component from `./button`.
    let mut project = jsx_button_project();
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export function ActionButton() { return <Button />; }",
    );
    project.parse_file("index.ts", "export { ActionButton } from './button';");

    let info = project.build_info("^2.0.0".into());
    assert_eq!(
        info.exports.get("ActionButton").map(String::as_str),
        Some("button.tsx")
    );
}

#[test]
fn build_info_resolves_aliased_re_exports() {
    // Public barrel name differs from the source export (`ActionButton as Button`).
    let mut project = jsx_button_project();
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export function ActionButton() { return <Button />; }",
    );
    project.parse_file(
        "index.ts",
        "export { ActionButton as Button } from './button';",
    );

    let info = project.build_info("^2.0.0".into());
    assert_eq!(
        info.exports.get("Button").map(String::as_str),
        Some("button.tsx")
    );
}

#[test]
fn build_info_resolves_default_re_exports() {
    // `export { default as Button }` maps both the alias and the `default` key.
    let mut project = jsx_button_project();
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export default function ActionButton() { return <Button />; }",
    );
    project.parse_file("index.ts", "export { default as Button } from './button';");

    let info = project.build_info("^2.0.0".into());
    assert_eq!(
        info.exports.get("Button").map(String::as_str),
        Some("button.tsx")
    );
    assert_eq!(
        info.exports.get("default").map(String::as_str),
        Some("button.tsx")
    );
}

#[test]
fn build_info_resolves_star_re_exports() {
    // `export *` merges the target module's public surface into the barrel.
    let mut project = jsx_button_project();
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export function ActionButton() { return <Button />; }",
    );
    project.parse_file("index.ts", "export * from './button';");

    let info = project.build_info("^2.0.0".into());
    assert_eq!(
        info.exports.get("ActionButton").map(String::as_str),
        Some("button.tsx")
    );
}

#[test]
fn build_info_ignores_unresolved_or_cyclic_re_exports() {
    let mut project = create_project(json!({}));

    // Missing target + mutual `export *` cycle — nothing should resolve.
    project.parse_file(
        "a.ts",
        "export * from './b'; export { Missing } from './missing';",
    );
    project.parse_file("b.ts", "export * from './a';");

    let info = project.build_info("^2.0.0".into());
    assert!(info.exports.is_empty());
}

// --- JSON round-trip + schema guard ---

#[test]
fn build_info_exports_round_trip_through_json() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": { "recipes": { "button": { "jsx": ["Button"], "base": { "display": "inline-flex" } } } }
    }));
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export function Btn() { return <Button />; }",
    );

    let info = project.build_info("^2.0.0".into());
    assert_eq!(
        info.exports.get("Btn").map(String::as_str),
        Some("button.tsx")
    );

    let json = serde_json::to_string(&info).expect("serialize");
    let restored: BuildInfo = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(info, restored);
}

#[test]
fn hydrate_rejects_incompatible_schema_version() {
    let source = lib_project();
    let mut info = source.build_info("^2.0.0".into());
    info.schema_version = 999;

    let mut consumer = create_project(json!({}));
    assert!(!consumer.hydrate("@acme/ds", &info, None));
    assert!(consumer.is_empty());
}

// --- JSX style props → build info atoms ---

#[test]
fn build_info_serializes_jsx_style_props_with_module_provenance() {
    let mut project = create_project(json!({
        "jsxFramework": "react"
    }));
    project.parse_file(
        "card.tsx",
        "import { Box } from '@panda/jsx'; export const Card = () => <Box color='red' padding='4px' />;",
    );

    let info = project.build_info("^2.0.0".into());

    assert_yaml_snapshot!(info.modules, @r"
    card.tsx:
      atoms:
        - 0
        - 1
    ");
    assert_yaml_snapshot!(info.atoms, @r"
    - p: 0
      v: 1
    - p: 2
      v: 3
    ");
}

#[test]
fn build_info_hydrates_jsx_style_props() {
    let mut source = create_project(json!({
        "jsxFramework": "react"
    }));
    source.parse_file(
        "card.tsx",
        "import { Box } from '@panda/jsx'; export const Card = () => <Box color='red' padding='4px' />;",
    );
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, None));
    assert_eq!(sorted_atoms(&consumer), sorted_atoms(&source));
}

#[test]
fn build_info_tree_shakes_jsx_style_props_by_module() {
    let mut source = create_project(json!({
        "jsxFramework": "react"
    }));
    source.parse_file(
        "card.tsx",
        "import { Box } from '@panda/jsx'; export const Card = () => <Box color='red' />;",
    );
    source.parse_file(
        "panel.tsx",
        "import { Box } from '@panda/jsx'; export const Panel = () => <Box padding='8px' />;",
    );
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, Some(&["card.tsx".into()])));
    assert_yaml_snapshot!(sorted_atoms(&consumer), @r"
    - prop: color
      value: red
      conditions: []
    ");
}

// --- Recipe JSX + non-variant style props on the same tag ---

fn recipe_jsx_with_style_props_project() -> pandacss_project::Project {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "theme": {
            "recipes": {
                "button": {
                    "jsx": ["Button"],
                    "base": { "display": "inline-flex" },
                    "variants": { "size": { "sm": { "fontSize": "12px" } } }
                }
            }
        }
    }));
    project.parse_file(
        "button.tsx",
        "import { Button } from './ui'; export const View = () => <Button size='sm' color='red' />;",
    );
    project
}

#[test]
fn build_info_serializes_recipe_jsx_with_atomic_style_props() {
    let info = recipe_jsx_with_style_props_project().build_info("^2.0.0".into());

    // `size` → recipe groups; `color` → extra atom on the same module.
    assert_yaml_snapshot!(info.modules, @r"
    button.tsx:
      atoms:
        - 0
      recipes:
        - 0
        - 1
    ");
    assert_yaml_snapshot!(info.atoms, @r"
    - p: 0
      v: 1
    ");
}

#[test]
fn build_info_hydrates_recipe_jsx_with_atomic_style_props() {
    let mut source = recipe_jsx_with_style_props_project();
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, None));
    assert_eq!(sorted_atoms(&consumer), sorted_atoms(&source));
    assert_eq!(emit_recipes(&mut consumer), emit_recipes(&mut source));
}

// --- Pattern JSX → atoms (pattern props without a JS transform callback) ---

#[test]
fn build_info_serializes_pattern_jsx_with_module_provenance() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxStyleProps": "none",
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "properties": { "gap": {} }
            }
        }
    }));
    project.parse_file(
        "stack.tsx",
        "import { Stack } from '@panda/jsx'; export const View = () => <Stack gap='8px' />;",
    );

    let info = project.build_info("^2.0.0".into());
    assert_yaml_snapshot!(info.modules, @r"
    stack.tsx:
      atoms:
        - 0
    ");
    assert_yaml_snapshot!(info.atoms, @r"
    - p: 0
      v: 1
    ");
}

#[test]
fn build_info_hydrates_pattern_jsx_atoms() {
    let mut source = create_project(json!({
        "jsxFramework": "react",
        "jsxStyleProps": "none",
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "properties": { "gap": {} }
            }
        }
    }));
    source.parse_file(
        "stack.tsx",
        "import { Stack } from '@panda/jsx'; export const View = () => <Stack gap='8px' />;",
    );
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({
        "jsxStyleProps": "none",
        "patterns": {
            "stack": {
                "jsxName": "Stack",
                "properties": { "gap": {} }
            }
        }
    }));
    assert!(consumer.hydrate("@acme/ds", &info, None));
    assert_eq!(sorted_atoms(&consumer), sorted_atoms(&source));
}

// --- jsxFactory styles at the definition site ---

#[test]
fn build_info_serializes_jsx_factory_styles_with_module_provenance() {
    let mut project = create_project(json!({
        "jsxFramework": "react",
        "jsxFactory": "panda"
    }));
    project.parse_file(
        "notice.tsx",
        "import { panda } from '@panda/jsx'; export const Notice = panda('div', { color: 'red', padding: '4px' });",
    );

    let info = project.build_info("^2.0.0".into());
    assert_yaml_snapshot!(info.modules, @r"
    notice.tsx:
      atoms:
        - 0
        - 1
    ");
}

#[test]
fn build_info_hydrates_jsx_factory_styles() {
    let mut source = create_project(json!({
        "jsxFramework": "react",
        "jsxFactory": "panda"
    }));
    source.parse_file(
        "notice.tsx",
        "import { panda } from '@panda/jsx'; export const Notice = panda('div', { color: 'red', padding: '4px' });",
    );
    let info = source.build_info("^2.0.0".into());

    let mut consumer = create_project(json!({ "jsxFactory": "panda" }));
    assert!(consumer.hydrate("@acme/ds", &info, None));
    assert_eq!(sorted_atoms(&consumer), sorted_atoms(&source));
}

#[test]
fn hydrate_round_trips_inline_cva_as_atoms() {
    // Inline `cva` decomposes to atoms (not the keyed recipe snapshot), so it
    // travels and tree-shakes through the atom path like any other style.
    let mut source = create_project(json!({}));
    source.parse_file(
        "button.tsx",
        "import { cva } from '@panda/css'; const b = cva({ base: { color: 'red' }, variants: { size: { sm: { fontSize: '12px' } } } }); b({ size: 'sm' });",
    );
    source.parse_file(
        "card.tsx",
        "import { cva } from '@panda/css'; const c = cva({ base: { margin: '8px' } }); c();",
    );
    let info = source.build_info("^2.0.0".into());

    // Importing only `button` tree-shakes `card`'s inline-recipe atoms away.
    let mut consumer = create_project(json!({}));
    assert!(consumer.hydrate("@acme/ds", &info, Some(&["button.tsx".into()])));
    assert_yaml_snapshot!(sorted_atoms(&consumer), @r#"
    - prop: color
      value: red
      conditions: []
    - prop: fontSize
      value: 12px
      conditions: []
    "#);
}
