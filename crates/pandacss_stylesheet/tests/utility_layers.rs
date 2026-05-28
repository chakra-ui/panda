mod common;

use insta::assert_snapshot;

use common::{compile_css, config};

#[test]
fn atom_with_layer_override_nests_inside_utilities() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c", "layer": "components" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red' });",
    );
    assert_snapshot!(css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      @layer components {
        .c_red {
          color: red;
        }
      }
    }
    ");
}

#[test]
fn atoms_without_layer_override_stay_in_utilities_top_level() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color":   { "className": "c" },
            "padding": { "className": "p" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', padding: '4' });",
    );
    assert_snapshot!(css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      .p_4 {
        padding: 4;
      }
      .c_red {
        color: red;
      }
    }
    ");
}

#[test]
fn default_atoms_emit_first_custom_sublayers_after() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color":   { "className": "c", "layer": "components" },
            "padding": { "className": "p" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', padding: '4' });",
    );
    assert_snapshot!(css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      .p_4 {
        padding: 4;
      }
      @layer components {
        .c_red {
          color: red;
        }
      }
    }
    ");
}

#[test]
fn distinct_custom_sublayers_each_get_their_own_nested_block() {
    // Order is cascade-sort: shorthands before longhands (padding → color).
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color":   { "className": "c", "layer": "components" },
            "padding": { "className": "p", "layer": "compositions" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red', padding: '4' });",
    );
    assert_snapshot!(css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      @layer compositions {
        .p_4 {
          padding: 4;
        }
      }
      @layer components {
        .c_red {
          color: red;
        }
      }
    }
    ");
}

#[test]
fn shorthand_prop_inherits_layer_override_from_canonical() {
    // The bucketing must resolve `bg` → `backgroundColor` before lookup.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "backgroundColor": {
                "className": "bg",
                "shorthand": "bg",
                "layer": "components"
            }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ bg: 'red' });",
    );
    assert_snapshot!(css, @r"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      @layer components {
        .bg_red {
          background-color: red;
        }
      }
    }
    ");
}

#[test]
fn utilities_wrapper_emits_even_when_default_bucket_is_empty() {
    // The wrapper preserves utility-relative cascade priority for sub-layers.
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c", "layer": "components" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'red' });",
    );
    assert!(css.contains("@layer utilities {"));
    assert!(css.contains("@layer components {"));
    // sub-layer must be NESTED, not a sibling.
    let utilities_pos = css.find("@layer utilities {").unwrap();
    let components_pos = css.find("@layer components {").unwrap();
    assert!(utilities_pos < components_pos);
    assert!(css[utilities_pos..].contains("@layer components {"));
}

#[test]
fn no_atoms_means_no_utilities_block_at_all() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c", "layer": "components" }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;");
}
