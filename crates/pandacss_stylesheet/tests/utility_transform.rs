//! Custom-utility `transform` callbacks returning a multi-declaration object
//! emit ONE class keyed on the utility (token-resolved, `!important` kept,
//! returned conditions lowered to selectors) — not per-property atoms. The
//! closure stands in for the JS callback through the real project path.

use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_extractor::{Diagnostic, Literal};
use pandacss_project::{AtomValue, ParseTransforms, Project, System, UtilityTransformFn};
use pandacss_stylesheet::{StylesheetInput, StylesheetLayer, StylesheetOptions};

use crate::common::config;

/// One leaf declaration shorthand for building a transform's return object.
fn decl(prop: &str, value: &str) -> (String, Literal) {
    (prop.to_owned(), Literal::String(value.to_owned()))
}

fn atom_value_str(value: &AtomValue) -> String {
    match value {
        AtomValue::String(value) | AtomValue::Number(value) | AtomValue::Token { value, .. } => {
            value.to_string()
        }
        AtomValue::Bool(value) => value.to_string(),
        AtomValue::Null => "null".to_owned(),
    }
}

/// Compile `source` with a utility transform closure and return the named layer.
fn compile_layer_with_transform<F>(
    cfg: &UserConfig,
    source: &str,
    layers: &[StylesheetLayer],
    mut transform: F,
) -> String
where
    F: FnMut(&str, &AtomValue, &AtomValue) -> Result<Option<Literal>, Diagnostic>,
{
    let system = System::new(cfg.clone()).expect("valid project");
    let mut project = Project::new(system);
    project.parse_file_with(
        "/style.ts",
        source,
        ParseTransforms {
            utility: Some(&mut transform as &mut UtilityTransformFn<'_>),
            ..Default::default()
        },
    );
    let snapshots = project.stylesheet_snapshots_with_utility_transform(
        cfg,
        &mut transform as &mut UtilityTransformFn<'_>,
    );
    pandacss_stylesheet::compile(
        StylesheetInput {
            config: cfg,
            token_dictionary: None,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
            view_transitions: snapshots.view_transitions,
            encoded_recipes: snapshots.encoded_recipes,
            static_encoded_recipes: Some(snapshots.static_encoded_recipes),
            static_pattern_atoms: &[],
            token_refs: snapshots.token_refs,
        },
        &StylesheetOptions::default(),
    )
    .get_layer_css(layers)
}

#[test]
fn multi_declaration_transform_emits_one_class_with_resolved_token() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "tokens": { "spacing": { "4": { "value": "1rem" } } } },
        "utilities": {
            "spaceX": {
                "className": "space-x",
                "values": "spacing",
                "transform": { "kind": "js-callback", "id": "spaceX" }
            }
        }
    }));
    // The closure receives the `values`-resolved value (`var(--spacing-4)`).
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ spaceX: '4' });",
        &[StylesheetLayer::Utilities],
        |_prop, resolved, _original| {
            let v = atom_value_str(resolved);
            Ok(Some(Literal::Object(vec![
                decl("marginLeft", &v),
                decl("marginRight", &v),
            ])))
        },
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .space-x_4 {
        margin-left: var(--spacing-4);
        margin-right: var(--spacing-4);
      }
    }
    ");
}

#[test]
fn single_declaration_transform_resolves_color_token() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "tokens": { "colors": { "red": { "value": "#f00" } } } },
        "utilities": {
            "boxColor": {
                "className": "bc",
                "values": "colors",
                "transform": { "kind": "js-callback", "id": "boxColor" }
            }
        }
    }));
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ boxColor: 'red' });",
        &[StylesheetLayer::Utilities],
        |_prop, resolved, _original| {
            Ok(Some(Literal::Object(vec![decl(
                "color",
                &atom_value_str(resolved),
            )])))
        },
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .bc_red {
        color: var(--colors-red);
      }
    }
    ");
}

#[test]
fn important_value_marks_every_declaration_important() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "tokens": { "colors": { "red": { "500": { "value": "#f00" } } } } },
        "utilities": {
            "singleDecl": {
                "className": "sd",
                "values": "colors",
                "transform": { "kind": "js-callback", "id": "singleDecl" }
            }
        }
    }));
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ singleDecl: 'red.500!' });",
        &[StylesheetLayer::Utilities],
        |_prop, resolved, _original| {
            Ok(Some(Literal::Object(vec![decl(
                "color",
                &atom_value_str(resolved),
            )])))
        },
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .sd_red\.500\! {
        color: var(--colors-red-500) !important;
      }
    }
    ");
}

#[test]
fn transform_returning_a_condition_lowers_to_a_selector() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": { "hover": "&:hover" },
        "utilities": {
            "debug": {
                "className": "debug",
                "transform": { "kind": "js-callback", "id": "debug" }
            }
        }
    }));
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ debug: true });",
        &[StylesheetLayer::Utilities],
        |_prop, _resolved, _original| {
            Ok(Some(Literal::Object(vec![(
                "_hover".to_owned(),
                Literal::Object(vec![decl("border", "2px solid blue")]),
            )])))
        },
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .debug_true:hover {
        border: 2px solid blue;
      }
    }
    ");
}

#[test]
fn transform_returning_a_child_selector_anchors_to_the_class() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "tokens": { "spacing": { "4": { "value": "1rem" } } } },
        "utilities": {
            "spaceX": {
                "className": "space-x",
                "values": "spacing",
                "transform": { "kind": "js-callback", "id": "spaceX" }
            }
        }
    }));
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ spaceX: '4' });",
        &[StylesheetLayer::Utilities],
        |_prop, resolved, _original| {
            let v = atom_value_str(resolved);
            Ok(Some(Literal::Object(vec![(
                "& > :not([hidden]) ~ :not([hidden])".to_owned(),
                Literal::Object(vec![
                    decl("marginInlineStart", &v),
                    decl("marginInlineEnd", "0px"),
                ]),
            )])))
        },
    );
    // Nested output sorts declarations (shared recipe/composition path); flat
    // output keeps source order.
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .space-x_4 > :not([hidden]) ~ :not([hidden]) {
        margin-inline-end: 0px;
        margin-inline-start: var(--spacing-4);
      }
    }
    ");
}

#[test]
fn override_styles_are_refcounted_across_files() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "tokens": { "spacing": { "4": { "value": "1rem" } } } },
        "utilities": {
            "spaceX": {
                "className": "space-x",
                "values": "spacing",
                "transform": { "kind": "js-callback", "id": "spaceX" }
            }
        }
    }));
    let mut transform = |_prop: &str,
                         resolved: &AtomValue,
                         _original: &AtomValue|
     -> Result<Option<Literal>, Diagnostic> {
        let v = atom_value_str(resolved);
        Ok(Some(Literal::Object(vec![decl("marginLeft", &v)])))
    };

    let system = System::new(cfg.clone()).expect("valid project");
    let mut project = Project::new(system);
    let src = "import { css } from '@panda/css'; css({ spaceX: '4' });";
    // Two files both contribute the same `(spaceX, 4)` styles.
    project.parse_file_with(
        "/a.ts",
        src,
        ParseTransforms {
            utility: Some(&mut transform as &mut UtilityTransformFn<'_>),
            ..Default::default()
        },
    );
    project.parse_file_with(
        "/b.ts",
        src,
        ParseTransforms {
            utility: Some(&mut transform as &mut UtilityTransformFn<'_>),
            ..Default::default()
        },
    );

    let compile = |project: &mut Project| {
        let snapshots = project.stylesheet_snapshots(&cfg);
        pandacss_stylesheet::compile(
            StylesheetInput {
                config: &cfg,
                token_dictionary: None,
                atoms: snapshots.atoms,
                utility_styles: snapshots.utility_styles,
                view_transitions: snapshots.view_transitions,
                encoded_recipes: snapshots.encoded_recipes,
                static_encoded_recipes: Some(snapshots.static_encoded_recipes),
                static_pattern_atoms: &[],
                token_refs: snapshots.token_refs,
            },
            &StylesheetOptions::default(),
        )
        .get_layer_css(&[StylesheetLayer::Utilities])
    };

    assert_snapshot!(compile(&mut project), @r"
    @layer utilities {
      .space-x_4 {
        margin-left: var(--spacing-4);
      }
    }
    ");
    // Removing one holder keeps the styles alive (refcount).
    project.remove_file("/a.ts");
    assert_snapshot!(compile(&mut project), @r"
    @layer utilities {
      .space-x_4 {
        margin-left: var(--spacing-4);
      }
    }
    ");
    // Removing the last holder drops the override and its class.
    project.remove_file("/b.ts");
    assert_snapshot!(compile(&mut project), @"");
}

/// Config for a CSS-variable utility with a shorthand, whose transform emits a
/// custom property. The closure returns styles only for the canonical `colorVar`
/// key — mirroring the real JS ref map, which is keyed by canonical name — so a
/// style authored via the `colorVarShort` shorthand only transforms if it was
/// normalized to the canonical key first.
fn color_variable_config() -> UserConfig {
    config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": { "tokens": { "colors": {
            "red": { "value": "#f00" },
            "blue": { "value": "#00f" },
            "green": { "value": "#0f0" }
        } } },
        "utilities": {
            "colorVar": {
                "className": "cv",
                "shorthand": "colorVarShort",
                "values": "colors",
                "transform": { "kind": "js-callback", "id": "colorVar" }
            }
        }
    }))
}

#[allow(
    clippy::unnecessary_wraps,
    clippy::result_large_err,
    reason = "signature must match UtilityTransformFn"
)]
fn color_variable_transform(
    prop: &str,
    resolved: &AtomValue,
    _original: &AtomValue,
) -> Result<Option<Literal>, Diagnostic> {
    if prop == "colorVar" {
        Ok(Some(Literal::Object(vec![decl(
            "--color-var",
            &atom_value_str(resolved),
        )])))
    } else {
        Ok(None)
    }
}

/// Adds a config recipe and slot recipe (both authored with the `colorVarShort`
/// shorthand) to [`color_variable_config`], plus the jsx/recipe import maps their
/// usage needs.
fn color_variable_recipe_config() -> UserConfig {
    config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": ["@panda/jsx"], "tokens": [] },
        "jsxFramework": "react",
        "theme": {
            "tokens": { "colors": {
                "blue": { "value": "#00f" },
                "green": { "value": "#0f0" }
            } },
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "colorVarShort": "blue" }
                }
            },
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root"],
                    "base": { "root": { "colorVarShort": "green" } }
                }
            }
        },
        "utilities": {
            "colorVar": {
                "className": "cv",
                "shorthand": "colorVarShort",
                "values": "colors",
                "transform": { "kind": "js-callback", "id": "colorVar" }
            }
        }
    }))
}

#[test]
fn config_recipe_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_recipe_config();
    let css = compile_layer_with_transform(
        &cfg,
        "import { button } from '@panda/recipes'; button()",
        &[StylesheetLayer::Recipes],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .button {
          --color-var: var(--colors-blue);
        }
      }
    }
    ");
}

#[test]
fn config_slot_recipe_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_recipe_config();
    let css = compile_layer_with_transform(
        &cfg,
        "import { card } from '@panda/recipes'; card()",
        &[StylesheetLayer::Recipes],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer recipes.slots {
      @layer base {
        .card__root {
          --color-var: var(--colors-green);
        }
      }
    }
    ");
}

#[test]
fn styled_recipe_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_recipe_config();
    let css = compile_layer_with_transform(
        &cfg,
        "import { styled } from '@panda/jsx'; const B = styled.div({ base: { colorVarShort: 'blue' } })",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .cv_blue {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn styled_style_object_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_recipe_config();
    let css = compile_layer_with_transform(
        &cfg,
        "import { styled } from '@panda/jsx'; const B = styled.div({ colorVarShort: 'blue' })",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      .cv_blue {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[allow(
    clippy::needless_pass_by_value,
    reason = "owned json reads naturally at call sites"
)]
fn global_css_config(body: serde_json::Value) -> UserConfig {
    config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": { "hover": "&:hover" },
        "theme": { "tokens": { "colors": { "blue": { "value": "#00f" }, "red": { "value": "#f00" } } } },
        "utilities": {
            "colorVar": {
                "className": "cv",
                "shorthand": "colorVarShort",
                "values": "colors",
                "transform": { "kind": "js-callback", "id": "colorVar" }
            }
        },
        "globalCss": { "body": body }
    }))
}

#[test]
fn global_css_applies_custom_utility_transform_via_shorthand() {
    let cfg = global_css_config(serde_json::json!({ "colorVarShort": "blue" }));
    let css =
        compile_layer_with_transform(&cfg, "", &[StylesheetLayer::Base], color_variable_transform);
    assert_snapshot!(css, @r"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      body {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn global_css_applies_custom_utility_transform_via_canonical_name() {
    let cfg = global_css_config(serde_json::json!({ "colorVar": "blue" }));
    let css =
        compile_layer_with_transform(&cfg, "", &[StylesheetLayer::Base], color_variable_transform);
    assert_snapshot!(css, @r"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      body {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn global_css_applies_custom_utility_transform_to_conditional_value() {
    let cfg = global_css_config(serde_json::json!({ "colorVarShort": { "_hover": "blue" } }));
    let css =
        compile_layer_with_transform(&cfg, "", &[StylesheetLayer::Base], color_variable_transform);
    assert_snapshot!(css, @r"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      body:hover {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn global_css_applies_custom_utility_transform_to_base_and_conditional_values() {
    let cfg = global_css_config(
        serde_json::json!({ "colorVarShort": { "base": "red", "_hover": "blue" } }),
    );
    let css =
        compile_layer_with_transform(&cfg, "", &[StylesheetLayer::Base], color_variable_transform);
    assert_snapshot!(css, @r"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      body {
        --color-var: var(--colors-red);
      }
      body:hover {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn global_css_applies_custom_utility_transform_under_nested_condition() {
    let cfg = global_css_config(serde_json::json!({ "_hover": { "colorVarShort": "blue" } }));
    let css =
        compile_layer_with_transform(&cfg, "", &[StylesheetLayer::Base], color_variable_transform);
    assert_snapshot!(css, @r"
    @layer base {
      :root {
        --made-with-panda: '🐼';
      }
      body:hover {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

/// [`color_variable_config`] plus a `composition` (text/layer/animation style)
/// authored with the `colorVarShort` shorthand.
fn composition_config(kind: &str, value: &serde_json::Value) -> UserConfig {
    let mut cfg = serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": { "hover": "&:hover" },
        "theme": {
            "tokens": { "colors": { "blue": { "value": "#00f" }, "red": { "value": "#f00" } } },
            "recipes": {},
        },
        "utilities": {
            "colorVar": {
                "className": "cv",
                "shorthand": "colorVarShort",
                "values": "colors",
                "transform": { "kind": "js-callback", "id": "colorVar" }
            }
        }
    });
    cfg["theme"][kind] = serde_json::json!({ "brand": { "value": value.clone() } });
    config(cfg)
}

#[test]
fn layer_style_applies_custom_utility_transform_via_shorthand() {
    let cfg = composition_config(
        "layerStyles",
        &serde_json::json!({ "colorVarShort": "blue" }),
    );
    let css = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ layerStyle: 'brand' });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      @layer compositions {
        .layerStyle_brand {
          --color-var: var(--colors-blue);
        }
      }
    }
    ");
}

#[test]
fn text_style_applies_custom_utility_transform_via_shorthand() {
    let cfg = composition_config(
        "textStyles",
        &serde_json::json!({ "colorVarShort": "blue" }),
    );
    let css = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ textStyle: 'brand' });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      @layer compositions {
        .textStyle_brand {
          --color-var: var(--colors-blue);
        }
      }
    }
    ");
}

#[test]
fn layer_style_applies_custom_utility_transform_to_conditional_value() {
    let cfg = composition_config(
        "layerStyles",
        &serde_json::json!({ "colorVarShort": { "_hover": "blue" } }),
    );
    let css = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ layerStyle: 'brand' });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(css, @r"
    @layer utilities {
      @layer compositions {
        .layerStyle_brand:hover {
          --color-var: var(--colors-blue);
        }
      }
    }
    ");
}

#[test]
fn css_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_config();
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ colorVarShort: 'red' });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .cv_red {
        --color-var: var(--colors-red);
      }
    }
    ");
}

#[test]
fn cva_base_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_config();
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { cva } from '@panda/css'; export const b = cva({ base: { colorVarShort: 'blue' } });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .cv_blue {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn cva_variant_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_config();
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { cva } from '@panda/css'; export const b = cva({ variants: { tone: { brand: { colorVarShort: 'blue' } } } });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .cv_blue {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn sva_base_applies_custom_utility_transform_via_shorthand() {
    let cfg = color_variable_config();
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { sva } from '@panda/css'; export const c = sva({ slots: ['root'], base: { root: { colorVarShort: 'green' } } });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .cv_green {
        --color-var: var(--colors-green);
      }
    }
    ");
}

#[test]
fn cva_base_applies_custom_utility_transform_via_canonical_name() {
    let cfg = color_variable_config();
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { cva } from '@panda/css'; export const b = cva({ base: { colorVar: 'blue' } });",
        &[StylesheetLayer::Utilities],
        color_variable_transform,
    );
    assert_snapshot!(utilities, @r"
    @layer utilities {
      .cv_blue {
        --color-var: var(--colors-blue);
      }
    }
    ");
}

#[test]
fn empty_transform_result_emits_nothing() {
    let cfg = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "noop": {
                "className": "noop",
                "transform": { "kind": "js-callback", "id": "noop" }
            }
        }
    }));
    let utilities = compile_layer_with_transform(
        &cfg,
        "import { css } from '@panda/css'; css({ noop: 'x' });",
        &[StylesheetLayer::Utilities],
        |_prop, _resolved, _original| Ok(Some(Literal::Object(Vec::new()))),
    );
    assert_snapshot!(utilities, @"");
}
