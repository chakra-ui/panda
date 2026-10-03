use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_output, config};

#[test]
fn emits_config_recipe_css() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "display": "inline-flex"
                    },
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        },
                        "variant": {
                            "solid": { "bg": "blue" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm', variant: 'solid' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .button {
          display: inline-flex;
        }
      }
      @layer variants {
        .button--size_sm {
          padding: 8px;
        }
        .button--variant_solid {
          background-color: blue;
        }
      }
    }
    ");
}

#[test]
fn mixed_regular_and_slot_recipes_follow_explicit_layer_order() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "display": "inline-flex"
                    },
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        }
                    }
                }
            },
            "slotRecipes": {
                "tabs": {
                    "className": "tabs",
                    "slots": ["root", "trigger"],
                    "base": {
                        "root": { "display": "flex" },
                        "trigger": { "display": "inline-flex" }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "padding": "4px" },
                                "trigger": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { button, tabs } from '@panda/recipes'; button({ size: 'sm' }); tabs({ size: 'sm' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .button {
          display: inline-flex;
        }
      }
      @layer variants {
        .button--size_sm {
          padding: 8px;
        }
      }
    }
    @layer recipes.slots {
      @layer base {
        .tabs__root {
          display: flex;
        }
        .tabs__trigger {
          display: inline-flex;
        }
      }
      @layer variants {
        .tabs__root--size_sm {
          padding: 4px;
        }
        .tabs__trigger--size_sm {
          padding: 2px;
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_nested_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "disabled": "&:disabled",
            "hover": "&:hover"
        },
        "utilities": {
            "backgroundColor": { "className": "bg" },
            "color": { "className": "c" },
            "display": { "className": "d" },
            "fontSize": { "className": "fs" },
            "gap": { "className": "gap" },
            "padding": { "className": "p" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "btn": {
                    "className": "btn",
                    "base": {
                        "display": "inline-flex",
                        "color": "red",
                        "_hover": {
                            "padding": "4px",
                            "_disabled": { "backgroundColor": "initial" }
                        },
                        "md": { "gap": "2px" }
                    },
                    "variants": {
                        "size": {
                            "lg": {
                                "fontSize": "16px",
                                "&[data-disabled]": { "color": "gray" },
                                "_hover": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { btn } from '@panda/recipes'; btn({ size: 'lg' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .btn {
          color: red;
          display: inline-flex;
        }
        .btn:disabled:hover {
          background-color: initial;
        }
        .btn:hover {
          padding: 4px;
        }
        @media (width >= 48rem) {
          .btn {
            gap: 2px;
          }
        }
      }
      @layer variants {
        .btn--size_lg {
          font-size: 16px;
        }
        .btn--size_lg[data-disabled] {
          color: gray;
        }
        .btn--size_lg:hover {
          padding: 2px;
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_nested_selector_and_responsive_condition() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "color": { "className": "c" },
            "marginRight": { "className": "mr" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "text": {
                    "className": "text",
                    "variants": {
                        "variant": {
                            "sm": {
                                "&:first-child": {
                                    "marginRight": "4px",
                                    "&:hover": {
                                        "color": {
                                            "base": "red",
                                            "md": "gray"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { text } from '@panda/recipes'; text({ variant: 'sm' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes {
      @layer variants {
        .text--variant_sm:first-child {
          margin-right: 4px;
        }
        .text--variant_sm:first-child:hover {
          color: red;
        }
        @media (width >= 48rem) {
          .text--variant_sm:first-child:hover {
            color: gray;
          }
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_variant_and_nested_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "padding": { "className": "p" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "btn": {
                    "className": "btn",
                    "variants": {
                        "size": {
                            "lg": {
                                "_hover": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { btn } from '@panda/recipes'; btn({ size: { md: 'lg' } })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer variants {
        @media (width >= 48rem) {
          .md\:btn--size_lg:hover {
            padding: 2px;
          }
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_condition_then_responsive_variant_order() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "padding": { "className": "p" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "btn": {
                    "className": "btn",
                    "variants": {
                        "size": {
                            "lg": { "padding": "2px" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { btn } from '@panda/recipes'; btn({ size: { _hover: { md: 'lg' } } })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer variants {
        @media (width >= 48rem) {
          .hover\:md\:btn--size_lg:hover {
            padding: 2px;
          }
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_responsive_then_condition_variant_order() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "padding": { "className": "p" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "btn": {
                    "className": "btn",
                    "variants": {
                        "size": {
                            "lg": { "padding": "2px" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { btn } from '@panda/recipes'; btn({ size: { md: { _hover: 'lg' } } })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer variants {
        @media (width >= 48rem) {
          .md\:hover\:btn--size_lg:hover {
            padding: 2px;
          }
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_responsive_array_variant() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "fontSize": { "className": "fs" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "btn": {
                    "className": "btn",
                    "variants": {
                        "size": {
                            "sm": { "fontSize": "12px" },
                            "md": { "fontSize": "16px" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { btn } from '@panda/recipes'; btn({ size: ['sm', 'md'] })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer variants {
        .btn--size_sm {
          font-size: 12px;
        }
        @media (width >= 48rem) {
          .md\:btn--size_md {
            font-size: 16px;
          }
        }
      }
    }
    ");
}

#[test]
fn emits_config_recipe_css_with_configured_separator() {
    let config = config(serde_json::json!({
        "separator": "__",
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "padding": { "className": "p" },
            "backgroundColor": { "className": "bg", "shorthand": "bg" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        },
                        "variant": {
                            "solid": { "bg": "blue" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm', variant: 'solid' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes {
      @layer variants {
        .button--size__sm {
          padding: 8px;
        }
        .button--variant__solid {
          background-color: blue;
        }
      }
    }
    ");
}

#[test]
fn hashes_recipe_class_names_with_prefix() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "hash": { "className": true },
        "prefix": { "className": "pd" },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "display": "inline-flex"
                    },
                    "variants": {
                        "size": {
                            "sm": { "padding": "8px" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { button } from '@panda/recipes'; button({ size: { _hover: 'sm' } })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .pd-ervFBh {
          display: inline-flex;
        }
      }
      @layer variants {
        .pd-iqkbpV:hover {
          padding: 8px;
        }
      }
    }
    ");
}

#[test]
fn prefixes_unhashed_recipe_class_names() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "prefix": { "className": "pd" },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" }
        },
        "theme": {
            "slotRecipes": {
                "checkbox": {
                    "className": "checkbox",
                    "slots": ["root", "control"],
                    "base": {
                        "root": { "display": "flex" },
                        "control": { "display": "inline-flex" }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "padding": "4px" },
                                "control": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { checkbox } from '@panda/recipes'; checkbox({ size: 'sm' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes.slots {
      @layer base {
        .pd-checkbox__control {
          display: inline-flex;
        }
        .pd-checkbox__root {
          display: flex;
        }
      }
      @layer variants {
        .pd-checkbox__control--size_sm {
          padding: 2px;
        }
        .pd-checkbox__root--size_sm {
          padding: 4px;
        }
      }
    }
    ");
}

#[test]
fn emits_config_slot_recipe_css_in_slots_layer() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" }
        },
        "theme": {
            "slotRecipes": {
                "checkbox": {
                    "className": "checkbox",
                    "slots": ["root", "control"],
                    "base": {
                        "root": { "display": "flex" },
                        "control": { "display": "inline-flex" }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "padding": "4px" },
                                "control": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { checkbox } from '@panda/recipes'; checkbox({ size: 'sm' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes.slots {
      @layer base {
        .checkbox__control {
          display: inline-flex;
        }
        .checkbox__root {
          display: flex;
        }
      }
      @layer variants {
        .checkbox__control--size_sm {
          padding: 2px;
        }
        .checkbox__root--size_sm {
          padding: 4px;
        }
      }
    }
    ");
}

#[test]
fn emits_config_slot_recipe_css_with_nested_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "display": { "className": "d" },
            "padding": { "className": "p" }
        },
        "theme": {
            "slotRecipes": {
                "checkbox": {
                    "className": "checkbox",
                    "slots": ["root"],
                    "base": {
                        "root": {
                            "display": "flex",
                            "_hover": { "padding": "4px" }
                        }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "root": {
                                    "_hover": { "padding": "2px" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { checkbox } from '@panda/recipes'; checkbox({ size: 'sm' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @"
    @layer recipes.slots {
      @layer base {
        .checkbox__root {
          display: flex;
        }
        .checkbox__root:hover {
          padding: 4px;
        }
      }
      @layer variants {
        .checkbox__root--size_sm:hover {
          padding: 2px;
        }
      }
    }
    ");
}

#[test]
fn emits_config_slot_recipe_css_with_responsive_then_condition_variant_order() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "padding": { "className": "p" }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "slotRecipes": {
                "checkbox": {
                    "className": "checkbox",
                    "slots": ["root"],
                    "variants": {
                        "size": {
                            "sm": {
                                "root": { "padding": "2px" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { checkbox } from '@panda/recipes'; checkbox({ size: { md: { _hover: 'sm' } } })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes.slots {
      @layer variants {
        @media (width >= 48rem) {
          .md\:hover\:checkbox__root--size_sm:hover {
            padding: 2px;
          }
        }
      }
    }
    ");
}

#[test]
fn recipe_base_text_style_uses_the_nested_default() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "textStyles": {
                "body": {
                    "DEFAULT": { "value": { "fontSize": "16px", "lineHeight": "1.6" } },
                    "compact": { "value": { "fontSize": "14px" } }
                }
            },
            "recipes": {
                "prose": { "className": "prose", "base": { "textStyle": "body" } }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { prose } from '@panda/recipes'; prose()",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .prose {
          font-size: 16px;
          line-height: 1.6;
        }
      }
    }
    ");
}

#[test]
fn composition_with_conditional_values_in_recipe_base_keeps_responsive_props() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "breakpoints": { "xs": "480px", "xl": "1280px" },
            "textStyles": {
                "body": {
                    "value": {
                        "fontFamily": "Montserrat, sans-serif",
                        "fontSize": { "base": "14px", "xs": "16px", "xl": "20px" },
                        "fontStyle": "normal",
                        "fontWeight": "500",
                        "lineHeight": { "base": "18px", "xs": "20px", "xl": "26px" }
                    }
                }
            },
            "recipes": {
                "viaTextStyle": {
                    "className": "viaTextStyle",
                    "base": { "textStyle": "body" }
                },
                "inlined": {
                    "className": "inlined",
                    "base": {
                        "fontFamily": "Montserrat, sans-serif",
                        "fontSize": { "base": "14px", "xs": "16px", "xl": "20px" },
                        "fontStyle": "normal",
                        "fontWeight": "500",
                        "lineHeight": { "base": "18px", "xs": "20px", "xl": "26px" }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { viaTextStyle, inlined } from '@panda/recipes'; viaTextStyle(); inlined()",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);
    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .inlined {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          font-style: normal;
          font-weight: 500;
          line-height: 18px;
        }
        @media (width >= 30rem) {
          .inlined {
            font-size: 16px;
            line-height: 20px;
          }
        }
        @media (width >= 80rem) {
          .inlined {
            font-size: 20px;
            line-height: 26px;
          }
        }
        .viaTextStyle {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          font-style: normal;
          font-weight: 500;
          line-height: 18px;
        }
        @media (width >= 30rem) {
          .viaTextStyle {
            font-size: 16px;
            line-height: 20px;
          }
        }
        @media (width >= 80rem) {
          .viaTextStyle {
            font-size: 20px;
            line-height: 26px;
          }
        }
      }
    }
    ");
}

#[test]
fn explicit_recipe_property_overrides_text_style_before_value_sorting() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "utilities": {
            "fontWeight": { "className": "fw", "values": "fontWeights" }
        },
        "theme": {
            "tokens": {
                "fontWeights": {
                    "normal": { "value": "400" },
                    "medium": { "value": "500" },
                    "semibold": { "value": "600" }
                }
            },
            "textStyles": {
                "body": { "value": { "fontWeight": "normal" } }
            },
            "recipes": {
                "lose": {
                    "className": "lose",
                    "base": { "textStyle": "body", "fontWeight": "medium" }
                },
                "win": {
                    "className": "win",
                    "base": { "fontWeight": "semibold", "textStyle": "body" }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { lose, win } from '@panda/recipes'; lose(); win();",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .lose {
          font-weight: var(--font-weights-medium);
        }
        .win {
          font-weight: var(--font-weights-semibold);
        }
      }
    }
    ");
}

#[test]
fn explicit_recipe_variant_properties_override_matching_composition_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "conditions": { "hover": "&:hover" },
        "utilities": { "fontWeight": {}, "lineHeight": {} },
        "theme": {
            "breakpoints": { "md": "768px" },
            "textStyles": {
                "body": {
                    "value": {
                        "fontWeight": "600",
                        "lineHeight": "1.5",
                        "_hover": { "fontWeight": "700" },
                        "md": { "fontWeight": "800" }
                    }
                }
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": {
                                "textStyle": "body",
                                "fontWeight": { "base": "400", "_hover": "500", "md": "600" }
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm' });",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer variants {
        .button--size_sm {
          font-weight: 400;
          line-height: 1.5;
        }
        .button--size_sm:hover {
          font-weight: 500;
        }
        @media (width >= 48rem) {
          .button--size_sm {
            font-weight: 600;
          }
        }
      }
    }
    ");
}

#[test]
fn explicit_slot_recipe_properties_override_layer_and_animation_styles() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "utilities": { "opacity": {}, "animationDuration": {}, "animationName": {} },
        "theme": {
            "layerStyles": { "dim": { "value": { "opacity": "0.9" } } },
            "animationStyles": {
                "enter": {
                    "value": { "animationDuration": "900ms", "animationName": "fade" }
                }
            },
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root", "label"],
                    "base": {
                        "root": { "layerStyle": "dim", "opacity": "0.4" }
                    },
                    "variants": {
                        "size": {
                            "sm": {
                                "label": { "animationStyle": "enter", "animationDuration": "400ms" }
                            }
                        }
                    },
                    "compoundVariants": [{
                        "size": "sm",
                        "css": { "root": { "layerStyle": "dim", "opacity": "0.2" } }
                    }]
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { card } from '@panda/recipes'; card({ size: 'sm' });",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes.slots {
      @layer base {
        .card__root {
          opacity: 0.4;
        }
      }
      @layer variants {
        .card__label--size_sm {
          animation-duration: 400ms;
          animation-name: fade;
        }
      }
      @layer compound_variants {
        .card__root--compound__size_sm {
          opacity: 0.2;
        }
      }
    }
    ");
}

#[test]
fn recipe_composition_overrides_preserve_important_and_unmatched_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "conditions": { "hover": "&:hover" },
        "utilities": { "fontWeight": {} },
        "theme": {
            "textStyles": {
                "strong": {
                    "value": {
                        "fontWeight": "700 !important",
                        "_hover": { "fontWeight": "800" }
                    }
                }
            },
            "recipes": {
                "message": {
                    "className": "message",
                    "base": { "textStyle": "strong", "fontWeight": "400" }
                },
                "alert": {
                    "className": "alert",
                    "base": { "textStyle": "strong", "fontWeight": "500 !important" }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { message, alert } from '@panda/recipes'; message(); alert();",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .alert {
          font-weight: 500 !important;
        }
        .alert:hover {
          font-weight: 800;
        }
        .message {
          font-weight: 700 !important;
        }
        .message:hover {
          font-weight: 800;
        }
      }
    }
    ");
}

#[test]
fn matching_recipe_composition_and_explicit_values_do_not_drop_the_property() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "utilities": { "fontWeight": {} },
        "theme": {
            "textStyles": { "body": { "value": { "fontWeight": "400" } } },
            "recipes": {
                "message": {
                    "className": "message",
                    "base": { "textStyle": "body", "fontWeight": "400" }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { message } from '@panda/recipes'; message();",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .message {
          font-weight: 400;
        }
      }
    }
    ");
}

#[test]
fn nested_compositions_keep_properties_from_the_nearer_scope() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "utilities": { "fontWeight": {}, "lineHeight": {} },
        "theme": {
            "textStyles": {
                "body": { "value": { "fontWeight": "700", "lineHeight": "1.5" } },
                "heading": { "value": { "textStyle": "body", "fontWeight": "500" } }
            },
            "recipes": {
                "message": { "className": "message", "base": { "textStyle": "heading" } }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { message } from '@panda/recipes'; message();",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .message {
          font-weight: 500;
          line-height: 1.5;
        }
      }
    }
    ");
}

#[test]
fn composition_overrides_merge_each_branch_of_a_block_condition() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "conditions": {
            "active": { "&:hover": "@slot", "&:focus": "@slot" }
        },
        "utilities": { "fontWeight": {} },
        "theme": {
            "textStyles": { "body": { "value": { "fontWeight": "700" } } },
            "recipes": {
                "message": {
                    "className": "message",
                    "base": { "_active": { "textStyle": "body", "fontWeight": "400" } }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { message } from '@panda/recipes'; message();",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .message:focus {
          font-weight: 400;
        }
        .message:hover {
          font-weight: 400;
        }
      }
    }
    ");
}

#[test]
fn composition_overrides_preserve_the_whole_explicit_fallback_run() {
    let config = config(serde_json::json!({
        "importMap": { "recipe": ["@panda/recipes"] },
        "utilities": { "color": {} },
        "theme": {
            "textStyles": { "body": { "value": { "color": "red" } } },
            "recipes": {
                "message": {
                    "className": "message",
                    "base": {
                        "textStyle": "body",
                        "color": "firstThatWorks(oklch(55% 0.18 250), blue)"
                    }
                }
            }
        }
    }));
    let css = compile_output(
        &config,
        "import { message } from '@panda/recipes'; message();",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Recipes]);

    assert_snapshot!(css, @r"
    @layer recipes {
      @layer base {
        .message {
          color: blue;
          color: oklch(55% 0.18 250);
        }
      }
    }
    ");
}
