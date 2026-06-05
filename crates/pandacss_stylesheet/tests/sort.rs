use insta::assert_snapshot;
use pandacss_stylesheet::StylesheetLayer;

use crate::common::{compile_css, compile_layer_css, config};

#[test]
fn sorts_pseudo_selectors_by_cascade_priority() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover",
            "focus": "&:focus",
            "active": "&:active",
            "custom": "&[data-open]"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _active: { color: 'red' }, _hover: { color: 'red' }, _focus: { color: 'red' }, _custom: { color: 'red' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .custom\:c_red[data-open] {
    color: red;
  }
  .hover\:c_red:hover {
    color: red;
  }
  .focus\:c_red:focus {
    color: red;
  }
  .active\:c_red:active {
    color: red;
  }
}
");
}

#[test]
fn applies_every_part_of_block_form_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hoverFine": {
                "@media (hover: hover)": {
                    "&:hover": "@slot"
                }
            },
            "before": "&::before"
        },
        "utilities": {
            "content": { "className": "content" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _before: { _hoverFine: { content: '\"x\"' } } })",
    );
    assert_snapshot!(css, @r#"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      @media (hover: hover) {
        .hoverFine\:before\:content_\"x\":hover::before {
          content: "x";
        }
      }
    }
    "#);
}

#[test]
fn sorts_breakpoints_by_resolved_width() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "breakpoints": {
                "lg": "64rem",
                "sm": "40rem"
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ lg: { color: 'red' }, sm: { color: 'red' } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  @media (width >= 40rem) {
    .sm\:c_red {
      color: red;
    }
  }
  @media (width >= 64rem) {
    .lg\:c_red {
      color: red;
    }
  }
}
");
}

#[test]
fn sorts_shorthands_before_longhands_within_same_condition() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "padding": { "className": "p" },
            "paddingTop": { "className": "pt" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ paddingTop: '4px', padding: '8px' })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  .p_8px {
    padding: 8px;
  }
  .pt_4px {
    padding-top: 4px;
  }
}
");
}

#[test]
fn sorts_axis_shorthands_before_state_variants() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover",
            "focus": "&:focus"
        },
        "utilities": {
            "padding": { "className": "p" },
            "paddingInline": { "className": "px", "shorthand": "px" },
            "paddingBlock": { "className": "py", "shorthand": "py" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ py: '12px', _focus: { _hover: { padding: '12px' } }, _hover: { padding: '4px' }, padding: '4px', px: '12px' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .p_4px {
    padding: 4px;
  }
  .px_12px {
    padding-inline: 12px;
  }
  .py_12px {
    padding-block: 12px;
  }
  .hover\:p_4px:hover {
    padding: 4px;
  }
  .hover\:focus\:p_12px:hover:focus {
    padding: 12px;
  }
}
");
}

#[test]
fn sorts_max_width_conditions_before_min_width_conditions() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "minSm": "@media (width >= 40rem)",
            "minLg": "@media (width >= 64rem)",
            "maxSm": "@media (width < 40rem)",
            "maxLg": "@media (width < 64rem)"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _minLg: { color: 'red' }, _maxSm: { color: 'red' }, _minSm: { color: 'red' }, _maxLg: { color: 'red' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @media (width < 64rem) {
    .maxLg\:c_red {
      color: red;
    }
  }
  @media (width < 40rem) {
    .maxSm\:c_red {
      color: red;
    }
  }
  @media (width >= 40rem) {
    .minSm\:c_red {
      color: red;
    }
  }
  @media (width >= 64rem) {
    .minLg\:c_red {
      color: red;
    }
  }
}
");
}

#[test]
fn sorts_same_root_attribute_variants_deterministically() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "dataHover": "&[data-hover]",
            "dataFocus": "&[data-focus]",
            "dataActive": "&[data-active]",
            "dataBar": "&[data-bar]",
            "dataFoo": "&[data-foo]"
        },
        "utilities": {
            "display": { "className": "d" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _dataHover: { display: 'flex' }, _dataFoo: { display: 'flex' }, _dataActive: { display: 'flex' }, _dataBar: { display: 'flex' }, _dataFocus: { display: 'flex' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .dataActive\:d_flex[data-active] {
    display: flex;
  }
  .dataBar\:d_flex[data-bar] {
    display: flex;
  }
  .dataFocus\:d_flex[data-focus] {
    display: flex;
  }
  .dataFoo\:d_flex[data-foo] {
    display: flex;
  }
  .dataHover\:d_flex[data-hover] {
    display: flex;
  }
}
");
}

#[test]
fn sorts_base_rules_before_selector_and_at_rule_variants() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover",
            "wide": "@media (width >= 64rem)"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _wide: { color: 'red' }, _hover: { color: 'red' }, color: 'red' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .c_red {
    color: red;
  }
  .hover\:c_red:hover {
    color: red;
  }
  @media (width >= 64rem) {
    .wide\:c_red {
      color: red;
    }
  }
}
");
}

#[test]
fn sorts_at_rule_kinds_by_cascade_bucket() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "print": "@media print",
            "media": "@media (prefers-reduced-motion: reduce)",
            "support": "@supports (display: grid)",
            "container": "@container card (width >= 40rem)",
            "starting": "@starting-style"
        },
        "utilities": {
            "opacity": { "className": "opacity" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _print: { opacity: '1' }, _starting: { opacity: '1' }, _container: { opacity: '1' }, _support: { opacity: '1' }, _media: { opacity: '1' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @supports (display: grid) {
    .support\:opacity_1 {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .media\:opacity_1 {
      opacity: 1;
    }
  }
  @container card (width >= 40rem) {
    .container\:opacity_1 {
      opacity: 1;
    }
  }
  @media print {
    .print\:opacity_1 {
      opacity: 1;
    }
  }
  @starting-style {
    .starting\:opacity_1 {
      opacity: 1;
    }
  }
}
");
}

#[test]
fn sorts_structural_form_and_interactive_pseudos() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "first": "&:first-child",
            "empty": "&:empty",
            "checked": "&:checked",
            "disabled": "&:disabled",
            "focusWithin": "&:focus-within",
            "hover": "&:hover",
            "focus": "&:focus",
            "active": "&:active"
        },
        "utilities": {
            "display": { "className": "d" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _active: { display: 'flex' }, _focus: { display: 'flex' }, _hover: { display: 'flex' }, _focusWithin: { display: 'flex' }, _disabled: { display: 'flex' }, _checked: { display: 'flex' }, _empty: { display: 'flex' }, _first: { display: 'flex' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .first\:d_flex:first-child {
    display: flex;
  }
  .empty\:d_flex:empty {
    display: flex;
  }
  .disabled\:d_flex:disabled {
    display: flex;
  }
  .checked\:d_flex:checked {
    display: flex;
  }
  .focusWithin\:d_flex:focus-within {
    display: flex;
  }
  .hover\:d_flex:hover {
    display: flex;
  }
  .focus\:d_flex:focus {
    display: flex;
  }
  .active\:d_flex:active {
    display: flex;
  }
}
");
}

#[test]
fn applies_pseudo_elements_after_multiple_pseudo_classes() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover",
            "focus": "&:focus",
            "before": "&::before"
        },
        "utilities": {
            "content": { "className": "content" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _before: { _focus: { _hover: { content: '\"x\"' } } } })",
    );
    assert_snapshot!(css, @r#"
    @layer reset, base, tokens, recipes, utilities;
    @layer utilities {
      .hover\:focus\:before\:content_\"x\":hover:focus::before {
        content: "x";
      }
    }
    "#);
}

#[test]
fn sorts_mixed_at_rule_and_selector_after_selector_only() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover",
            "hoverFine": {
                "@media (hover: hover)": {
                    "&:hover": "@slot"
                }
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _hoverFine: { color: 'red' }, _hover: { color: 'red' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .hover\:c_red:hover {
    color: red;
  }
  @media (hover: hover) {
    .hoverFine\:c_red:hover {
      color: red;
    }
  }
}
");
}

#[test]
fn sorts_stacked_max_and_min_conditions_by_outer_priority() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "minSm": "@media (width >= 40rem)",
            "minLg": "@media (width >= 64rem)",
            "maxSm": "@media (width < 40rem)",
            "maxLg": "@media (width < 64rem)"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _minSm: { _maxLg: { color: 'red' } }, _minLg: { _maxSm: { color: 'red' } } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @media (width < 64rem) {
    @media (width >= 40rem) {
      .maxLg\:minSm\:c_red {
        color: red;
      }
    }
  }
  @media (width < 40rem) {
    @media (width >= 64rem) {
      .maxSm\:minLg\:c_red {
        color: red;
      }
    }
  }
}
");
}

#[test]
fn sorts_breakpoint_units_by_resolved_length() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "theme": {
            "breakpoints": {
                "widePx": "960px",
                "narrowRem": "40rem"
            }
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ widePx: { color: 'red' }, narrowRem: { color: 'red' } })",
        &[StylesheetLayer::Utilities],
    );
    assert_snapshot!(css, @r"
@layer utilities {
  @media (width >= 40rem) {
    .narrowRem\:c_red {
      color: red;
    }
  }
  @media (width >= 60rem) {
    .widePx\:c_red {
      color: red;
    }
  }
}
");
}

#[test]
fn sorts_css_function_queries_deterministically() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "calcB": "@media (width >= calc(100% - 1rem))",
            "calcA": "@media (width >= calc(100% - 2rem))"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _calcB: { color: 'red' }, _calcA: { color: 'red' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @media (width >= calc(100% - 1rem)) {
    .calcB\:c_red {
      color: red;
    }
  }
  @media (width >= calc(100% - 2rem)) {
    .calcA\:c_red {
      color: red;
    }
  }
}
");
}

#[test]
fn sorts_container_queries_by_resolved_width() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "containerLg": "@container card (width >= 64rem)",
            "containerSm": "@container card (width >= 40rem)"
        },
        "utilities": {
            "display": { "className": "d" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _containerLg: { display: 'flex' }, _containerSm: { display: 'flex' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  @container card (width >= 40rem) {
    .containerSm\:d_flex {
      display: flex;
    }
  }
  @container card (width >= 64rem) {
    .containerLg\:d_flex {
      display: flex;
    }
  }
}
");
}

#[test]
fn sorts_recipe_entries_with_the_same_priority_model() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "padding": { "className": "p" },
            "paddingTop": { "className": "pt" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "paddingTop": "4px",
                        "padding": "8px"
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "import { button } from '@panda/recipes'; button()");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  @layer base {
    .button {
      padding: 8px;
      padding-top: 4px;
    }
  }
}
");
}

#[test]
fn coalesces_recipe_entries_with_matching_pseudo_targets() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": {
                "button": [{ "conditions": ["hover"], "size": ["sm"] }]
            }
        },
        "conditions": {
            "hover": "&:hover"
        },
        "utilities": {
            "padding": { "className": "p" },
            "paddingTop": { "className": "pt" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": {
                                "paddingTop": "4px",
                                "padding": "8px"
                            }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button--size_sm {
    padding: 8px;
    padding-top: 4px;
  }
  .hover\:button--size_sm:hover {
    padding: 8px;
    padding-top: 4px;
  }
}
");
}

#[test]
fn coalesces_recipe_entries_with_matching_at_rule_targets() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": {
                "button": [{ "responsive": true, "size": ["sm"] }]
            }
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": {
                                "paddingTop": "4px",
                                "padding": "8px"
                            }
                        }
                    }
                }
            }
        },
        "utilities": {
            "padding": { "className": "p" },
            "paddingTop": { "className": "pt" }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer tokens {
  :where(:root, :host) {
    --breakpoints-md: 48rem;
    --sizes-breakpoint-md: 48rem;
  }
}
@layer recipes {
  .button--size_sm {
    padding: 8px;
    padding-top: 4px;
  }
  @media (width >= 48rem) {
    .md\:button--size_sm {
      padding: 8px;
      padding-top: 4px;
    }
  }
}
");
}

#[test]
fn keeps_mixed_recipe_targets_separate_while_coalescing_each_target() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": {
                "button": [{ "conditions": ["hover"], "responsive": true, "size": ["sm"] }]
            }
        },
        "conditions": {
            "hover": "&:hover"
        },
        "theme": {
            "breakpoints": {
                "md": "48rem"
            },
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": {
                                "paddingTop": "4px",
                                "padding": "8px"
                            }
                        }
                    }
                }
            }
        },
        "utilities": {
            "padding": { "className": "p" },
            "paddingTop": { "className": "pt" }
        }
    }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer tokens {
  :where(:root, :host) {
    --breakpoints-md: 48rem;
    --sizes-breakpoint-md: 48rem;
  }
}
@layer recipes {
  .button--size_sm {
    padding: 8px;
    padding-top: 4px;
  }
  .hover\:button--size_sm:hover {
    padding: 8px;
    padding-top: 4px;
  }
  @media (width >= 48rem) {
    .md\:button--size_sm {
      padding: 8px;
      padding-top: 4px;
    }
  }
}
");
}

#[test]
fn coalesces_duplicate_recipe_declarations_by_css_property() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": {
            "backgroundColor": { "className": "bg-c", "shorthand": "bgColor" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "bgColor": "red",
                        "backgroundColor": "blue"
                    }
                }
            }
        }
    }));
    let css = compile_css(&config, "import { button } from '@panda/recipes'; button()");
    assert_snapshot!(css, @"
    @layer reset, base, tokens, recipes, utilities;
    @layer recipes {
      @layer base {
        .button {
          background-color: red;
        }
      }
    }
    ");
}

#[test]
fn sorts_recipe_atomic_atoms_with_dynamic_atoms() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "staticCss": {
            "recipes": "*"
        },
        "utilities": {
            "padding": { "className": "p" },
            "paddingTop": { "className": "pt" }
        },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "variants": {
                        "size": {
                            "sm": { "paddingTop": "4px" }
                        }
                    },
                    "compoundVariants": [
                        {
                            "size": "sm",
                            "css": { "padding": "8px" }
                        }
                    ]
                }
            }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ paddingTop: '2px' })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer recipes {
  .button--size_sm {
    padding-top: 4px;
  }
}
@layer utilities {
  .p_8px {
    padding: 8px;
  }
  .pt_2px {
    padding-top: 2px;
  }
}
");
}

#[test]
fn sorts_unknown_selector_conditions_before_known_pseudos() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "dataOpen": "&[data-open]",
            "hover": "&:hover"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _hover: { color: 'red' }, _dataOpen: { color: 'red' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .dataOpen\:c_red[data-open] {
    color: red;
  }
  .hover\:c_red:hover {
    color: red;
  }
}
");
}

#[test]
fn sorts_compound_pseudo_conditions_by_total_pseudo_priority() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "hoverFocus": "&:hover:focus",
            "hover": "&:hover"
        },
        "utilities": {
            "color": { "className": "c" }
        }
    }));
    let css = compile_css(
        &config,
        "import { css } from '@panda/css'; css({ _hoverFocus: { color: 'red' }, _hover: { color: 'red' } })",
    );
    assert_snapshot!(css, @r"
@layer reset, base, tokens, recipes, utilities;
@layer utilities {
  .hover\:c_red:hover {
    color: red;
  }
  .hoverFocus\:c_red:hover:focus {
    color: red;
  }
}
");
}
