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
        AtomValue::String(value) | AtomValue::Number(value) => value.to_string(),
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
    let snapshots = project.stylesheet_snapshots(cfg);
    pandacss_stylesheet::compile(
        StylesheetInput {
            config: cfg,
            token_dictionary: None,
            atoms: snapshots.atoms,
            utility_styles: snapshots.utility_styles,
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
