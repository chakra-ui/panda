mod common;

use insta::assert_snapshot;

use common::{compile_css, config};

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
    let css = compile_css(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm', variant: 'solid' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  @layer base {
    .button {
      display: inline-flex;
    }
  }
  .button--size_sm {
    padding: 8px;
  }
  .button--variant_solid {
    background-color: blue;
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
    let css = compile_css(
        &config,
        "import { button } from '@panda/recipes'; button({ size: 'sm', variant: 'solid' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button--size__sm {
    padding: 8px;
  }
  .button--variant__solid {
    background-color: blue;
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
    let css = compile_css(
        &config,
        "import { button } from '@panda/recipes'; button({ size: { _hover: 'sm' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  @layer base {
    .pd-ervFBh {
      display: inline-flex;
    }
  }
  .pd-iqkbpV:hover {
    padding: 8px;
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
    let css = compile_css(
        &config,
        "import { checkbox } from '@panda/recipes'; checkbox({ size: 'sm' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes.slots {
  @layer base {
    .pd-checkbox__control {
      display: inline-flex;
    }
    .pd-checkbox__root {
      display: flex;
    }
  }
  .pd-checkbox__control--size_sm {
    padding: 2px;
  }
  .pd-checkbox__root--size_sm {
    padding: 4px;
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
    let css = compile_css(
        &config,
        "import { checkbox } from '@panda/recipes'; checkbox({ size: 'sm' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes.slots {
  @layer base {
    .checkbox__control {
      display: inline-flex;
    }
    .checkbox__root {
      display: flex;
    }
  }
  .checkbox__control--size_sm {
    padding: 2px;
  }
  .checkbox__root--size_sm {
    padding: 4px;
  }
}
");
}
