use insta::assert_snapshot;
use pandacss_config::UserConfig;
use pandacss_project::Project;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};
use pandacss_system::System;

use crate::common::{config, project_input};

fn chip_config(color: &str) -> UserConfig {
    config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"], "jsx": ["@panda/jsx"] },
        "jsxFramework": "react",
        "theme": {
            "recipes": {
                "chip": {
                    "className": "chip",
                    "jsx": ["Chip"],
                    "base": { "display": "inline-flex", "alignItems": "center", "gap": "4px", "color": color },
                    "variants": { "size": { "sm": { "fontSize": "12px", "height": "24px" } } }
                }
            }
        }
    }))
}

fn project(config: &UserConfig, path: &str, source: &str) -> Project {
    let mut project = Project::new(System::new(config.clone()).expect("valid project"));
    project.parse_file(path, source);
    project
}

/// The recipes CSS of an app that uses `@acme/ds`, whose `Chip` renders `chip({ size: 'sm' })`.
fn app_recipes_css(design_system: &UserConfig, app: &UserConfig, app_source: &str) -> String {
    let design_system = project(
        design_system,
        "chip.tsx",
        "import { chip } from '@panda/recipes';\nexport const Chip = () => <span className={chip({ size: 'sm' })} />;",
    );
    let build_info = design_system.build_info("^2.0.0".into());

    let mut app_project = project(app, "app.tsx", app_source);
    assert!(app_project.hydrate("@acme/ds", &build_info, None));
    let snapshots = app_project.stylesheet_snapshots(app);
    pandacss_stylesheet::compile(
        project_input(app, &snapshots),
        &StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes])
}

#[test]
fn app_using_a_design_system_recipe_emits_each_rule_once() {
    let config = chip_config("red");
    let css = app_recipes_css(
        &config,
        &config,
        "import { chip } from '@panda/recipes';\nexport const App = () => <div className={chip({ size: 'sm' })} />;",
    );
    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .chip {
          gap: 4px;
          align-items: center;
          color: red;
          display: inline-flex;
        }
      }
      @layer variants {
        .chip--size_sm {
          font-size: 12px;
          height: 24px;
        }
      }
    }
    ");
}

#[test]
fn app_using_a_design_system_slot_recipe_emits_each_rule_once() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "theme": {
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root", "title"],
                    "base": {
                        "root": { "display": "flex", "gap": "8px" },
                        "title": { "fontWeight": "600", "fontSize": "14px" }
                    },
                    "variants": { "size": { "sm": { "root": { "padding": "4px", "borderRadius": "4px" } } } }
                }
            }
        }
    }));
    let usage = "import { card } from '@panda/recipes';\ncard({ size: 'sm' });";
    let design_system = project(&config, "card.tsx", usage);
    let build_info = design_system.build_info("^2.0.0".into());

    let mut app = project(&config, "app.tsx", usage);
    assert!(app.hydrate("@acme/ds", &build_info, None));
    let snapshots = app.stylesheet_snapshots(&config);
    let css = pandacss_stylesheet::compile(
        project_input(&config, &snapshots),
        &StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes.slots {
      @layer base {
        .card__root {
          gap: 8px;
          display: flex;
        }
        .card__title {
          font-size: 14px;
          font-weight: 600;
        }
      }
      @layer variants {
        .card__root--size_sm {
          padding: 4px;
          border-radius: 4px;
        }
      }
    }
    ");
}
