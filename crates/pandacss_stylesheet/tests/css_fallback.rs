//! `fallback(a, b)` — ordered CSS value fallbacks.
//!
//! One authored value, one atom, one class, one declaration per member.
//! Members are written most-preferred first and emitted in reverse, so the
//! preferred value is the last declaration and wins where it is supported.
//! Every snapshot here is a cascade contract.

use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_layer_css, compile_output, config};

fn fallback_config() -> pandacss_config::UserConfig {
    config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": { "hover": "&:hover", "dark": "[data-theme=dark] &" },
        "theme": {
            "breakpoints": { "md": "768px" },
            "tokens": { "colors": { "brand": { "value": "#0057b8" } } }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "width": {},
            "padding": { "shorthand": "p" },
            "backgroundColor": { "className": "bg", "shorthand": "bg", "values": "colors" }
        }
    }))
}

fn utilities_css(source: &str) -> String {
    compile_layer_css(&fallback_config(), source, &[StylesheetLayer::Utilities])
}

#[test]
fn the_preferred_member_is_emitted_last_so_it_wins() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(55% 0.18 250), #0057b8)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(55\%_0\.18_250\)\,_\#0057b8\) {
        color: #0057b8;
        color: oklch(55% 0.18 250);
      }
    }
    ");
}

#[test]
fn a_comma_inside_a_member_does_not_split_the_run() {
    // `min(60rem, 100%)` is one member, not two.
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ width: 'fallback(min(60rem, 100%), 75%)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .width_fallback\(min\(60rem\,_100\%\)\,_75\%\) {
        width: 75%;
        width: min(60rem, 100%);
      }
    }
    ");
}

#[test]
fn a_three_member_run_emits_three_declarations_least_preferred_first() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), color(display-p3 1 0 0), red)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_color\(display-p3_1_0_0\)\,_red\) {
        color: red;
        color: color(display-p3 1 0 0);
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

#[test]
fn swapping_two_members_produces_a_different_class() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(red, blue)' }); css({ color: 'fallback(blue, red)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(blue\,_red\) {
        color: red;
        color: blue;
      }
      .c_fallback\(red\,_blue\) {
        color: blue;
        color: red;
      }
    }
    ");
}

#[test]
fn identical_runs_deduplicate_to_one_class() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(red, blue)' }); css({ color: 'fallback(red, blue)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(red\,_blue\) {
        color: blue;
        color: red;
      }
    }
    ");
}

#[test]
fn a_run_resolves_tokens_and_shorthands_per_member() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ bg: 'fallback(oklch(55% 0.18 250), brand)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .bg_fallback\(oklch\(55\%_0\.18_250\)\,_brand\) {
        background-color: var(--colors-brand);
        background-color: oklch(55% 0.18 250);
      }
    }
    ");
}

#[test]
fn a_bare_number_member_takes_the_property_unit() {
    // `4` is the fallback here, so it is emitted first.
    let css = utilities_css("import { css } from '@panda/css'; css({ p: 'fallback(1rem, 4)' })");

    assert_snapshot!(css, @r"
    @layer utilities {
      .p_fallback\(1rem\,_4\) {
        padding: 4px;
        padding: 1rem;
      }
    }
    ");
}

#[test]
fn a_run_under_a_condition_wraps_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ _hover: { color: 'fallback(oklch(60% 0.2 30), red)' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .hover\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\):hover {
        color: red;
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

#[test]
fn a_run_under_a_breakpoint_wraps_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: { md: 'fallback(oklch(60% 0.2 30), red)' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      @media (width >= 48rem) {
        .md\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
          color: red;
          color: oklch(60% 0.2 30);
        }
      }
    }
    ");
}

#[test]
fn an_important_run_marks_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(red, blue) !important' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(red\,_blue\)\! {
        color: blue !important;
        color: red !important;
      }
    }
    ");
}

#[test]
fn a_run_inside_a_recipe_emits_under_the_recipe_class() {
    let config = config(serde_json::json!({
        "importMap": { "css": [], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" } },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "color": "fallback(oklch(55% 0.18 250), #0057b8)" }
                }
            }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { button } from '@panda/recipes'; button()",
        &[StylesheetLayer::Recipes],
    );

    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .button {
          color: #0057b8;
          color: oklch(55% 0.18 250);
        }
      }
    }
    ");
}

#[test]
fn a_minified_run_keeps_both_declarations() {
    let css = compile_output(
        &fallback_config(),
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red)' })",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    )
    .get_layer_css(&[StylesheetLayer::Utilities]);

    assert_snapshot!(css, @r"@layer utilities{.c_fallback\(oklch\(60\%_0\.2_30\)\,_red\){color:red;color:oklch(60% 0.2 30);}}");
}

#[test]
fn a_single_member_call_emits_nothing() {
    // One value has no baseline to fall back to, so it is not a run — and the
    // form means a run or nothing.
    let css = utilities_css("import { css } from '@panda/css'; css({ color: 'fallback(red)' })");

    assert_snapshot!(css, @"");
}

#[test]
fn an_unbalanced_value_emits_nothing() {
    // Unbalanced nesting is never split, and never emitted verbatim.
    let css =
        utilities_css("import { css } from '@panda/css'; css({ color: 'fallback(red, blue' })");

    assert_snapshot!(css, @"");
}

#[test]
fn an_ordinary_css_function_is_untouched() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ width: 'min(60rem, 100%)', color: 'color-mix(in oklch, red, blue)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_color-mix\(in_oklch\,_red\,_blue\) {
        color: color-mix(in oklch, red, blue);
      }
      .width_min\(60rem\,_100\%\) {
        width: min(60rem, 100%);
      }
    }
    ");
}

// --- Nesting and conditional shapes ---

#[test]
fn a_run_nested_three_conditions_deep_wraps_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ _hover: { _dark: { md: { color: 'fallback(oklch(60% 0.2 30), red)' } } } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      @media (width >= 48rem) {
        [data-theme=dark] .hover\:dark\:md\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\):hover {
          color: red;
          color: oklch(60% 0.2 30);
        }
      }
    }
    ");
}

#[test]
fn a_conditional_value_object_runs_each_branch_independently() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: { base: 'fallback(oklch(60% 0.2 30), red)', _hover: 'fallback(oklch(50% 0.2 260), blue)' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
      .hover\:c_fallback\(oklch\(50\%_0\.2_260\)\,_blue\):hover {
        color: blue;
        color: oklch(50% 0.2 260);
      }
    }
    ");
}

#[test]
fn a_responsive_array_of_runs_emits_one_run_per_breakpoint() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ width: ['fallback(min(60rem, 100%), 100%)', 'fallback(min(70rem, 75%), 75%) '] })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .width_fallback\(min\(60rem\,_100\%\)\,_100\%\) {
        width: 100%;
        width: min(60rem, 100%);
      }
      @media (width >= 48rem) {
        .md\:width_fallback\(min\(70rem\,_75\%\)\,_75\%\) {
          width: 75%;
          width: min(70rem, 75%);
        }
      }
    }
    ");
}

#[test]
fn a_run_under_a_nested_selector_wraps_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ '& > span': { color: 'fallback(oklch(60% 0.2 30), red)' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .\[\&_\>_span\]\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) > span {
        color: red;
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

#[test]
fn a_run_under_a_raw_media_condition_wraps_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ '@media print': { color: 'fallback(oklch(60% 0.2 30), red)' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      @media print {
        .\[\@media_print\]\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
          color: red;
          color: oklch(60% 0.2 30);
        }
      }
    }
    ");
}

// --- Interaction with ordinary values ---

#[test]
fn a_later_scalar_in_the_same_object_replaces_the_whole_run() {
    // One property, one winner — the run does not survive as a baseline.
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(red, blue)', ...{ color: 'green' } })",
    );

    assert_snapshot!(css, @"
    @layer utilities {
      .c_green {
        color: green;
      }
    }
    ");
}

#[test]
fn a_run_and_a_scalar_on_the_same_property_are_separate_atoms() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(red, blue)' }); css({ color: 'green' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(red\,_blue\) {
        color: blue;
        color: red;
      }
      .c_green {
        color: green;
      }
    }
    ");
}

// --- Malformed and adversarial members ---

#[test]
fn a_nested_run_emits_nothing() {
    // Runs do not compose. One property's members are already ordered, so
    // nesting adds nothing — and emitting the inner text would put a function
    // no browser implements into the sheet.
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(fallback(red, blue), green)' })",
    );

    assert_snapshot!(css, @"");
}

#[test]
fn an_empty_member_is_dropped_from_the_run() {
    let css =
        utilities_css("import { css } from '@panda/css'; css({ color: 'fallback(red, , blue)' })");

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(red\,_\,_blue\) {
        color: blue;
        color: red;
      }
    }
    ");
}

#[test]
fn a_trailing_comma_does_not_add_a_member() {
    let css =
        utilities_css("import { css } from '@panda/css'; css({ color: 'fallback(red, blue,)' })");

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(red\,_blue\,\) {
        color: blue;
        color: red;
      }
    }
    ");
}

#[test]
fn a_member_holding_a_var_with_a_comma_fallback_stays_one_member() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(var(--brand, blue), red)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(var\(--brand\,_blue\)\,_red\) {
        color: red;
        color: var(--brand, blue);
      }
    }
    ");
}

// --- Recipes ---

#[test]
fn a_run_in_a_recipe_variant_emits_under_the_variant_class() {
    let config = config(serde_json::json!({
        "importMap": { "css": [], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" }, "backgroundColor": { "className": "bg" } },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": { "color": "fallback(oklch(55% 0.18 250), #0057b8)" },
                    "variants": {
                        "visual": {
                            "solid": { "backgroundColor": "fallback(oklch(55% 0.18 250), #0057b8)" }
                        }
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { button } from '@panda/recipes'; button({ visual: 'solid' })",
        &[StylesheetLayer::Recipes],
    );

    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .button {
          color: #0057b8;
          color: oklch(55% 0.18 250);
        }
      }
      @layer variants {
        .button--visual_solid {
          background-color: #0057b8;
          background-color: oklch(55% 0.18 250);
        }
      }
    }
    ");
}

#[test]
fn a_run_in_a_slot_recipe_emits_under_each_slot_class() {
    let config = config(serde_json::json!({
        "importMap": { "css": [], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" }, "width": {} },
        "theme": {
            "slotRecipes": {
                "card": {
                    "className": "card",
                    "slots": ["root", "title"],
                    "base": {
                        "root": { "width": "fallback(100%, min(70rem, 100%))" },
                        "title": { "color": "fallback(oklch(20% 0.02 250), #111)" }
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { card } from '@panda/recipes'; card()",
        &[StylesheetLayer::Recipes],
    );

    assert_snapshot!(css, @"
    @layer recipes.slots {
      @layer base {
        .card__root {
          width: min(70rem, 100%);
          width: 100%;
        }
        .card__title {
          color: #111;
          color: oklch(20% 0.02 250);
        }
      }
    }
    ");
}

#[test]
fn a_run_nested_in_a_later_member_emits_nothing() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(red, fallback(blue, green))' })",
    );

    assert_snapshot!(css, @"");
}

#[test]
fn a_nested_run_in_a_recipe_emits_nothing_for_that_property() {
    // The sibling property still emits — one bad value does not void the rule.
    let config = config(serde_json::json!({
        "importMap": { "css": [], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" }, "width": {} },
        "theme": {
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "color": "fallback(fallback(red, blue), green)",
                        "width": "fallback(75%, 100%)"
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { button } from '@panda/recipes'; button()",
        &[StylesheetLayer::Recipes],
    );

    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .button {
          width: 100%;
          width: 75%;
        }
      }
    }
    ");
}

#[test]
fn a_deeply_nested_run_emits_nothing() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ _hover: { md: { color: 'fallback(fallback(a, b), c)' } } })",
    );

    assert_snapshot!(css, @"");
}

// --- The `css.fallback()` API ---

#[test]
fn the_fallback_api_emits_the_same_css_as_the_written_form() {
    let from_api = utilities_css(
        "import { css } from '@panda/css'; css({ width: css.fallback('min(60rem, 100%)', '75%') })",
    );
    let from_string = utilities_css(
        "import { css } from '@panda/css'; css({ width: 'fallback(min(60rem, 100%), 75%)' })",
    );

    assert_eq!(from_api, from_string);
    assert_snapshot!(from_api, @r"
    @layer utilities {
      .width_fallback\(min\(60rem\,_100\%\)\,_75\%\) {
        width: 75%;
        width: min(60rem, 100%);
      }
    }
    ");
}

#[test]
fn the_fallback_api_resolves_tokens_per_member() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ bg: css.fallback('oklch(55% 0.18 250)', 'brand') })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .bg_fallback\(oklch\(55\%_0\.18_250\)\,_brand\) {
        background-color: var(--colors-brand);
        background-color: oklch(55% 0.18 250);
      }
    }
    ");
}

#[test]
fn the_fallback_api_works_under_conditions() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ _hover: { color: css.fallback('oklch(60% 0.2 30)', 'red') } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .hover\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\):hover {
        color: red;
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

#[test]
fn a_dynamic_member_emits_no_css() {
    // Emitting only the baseline would make dev and production diverge.
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ width: css.fallback(enhanced, '75%') })",
    );

    assert_snapshot!(css, @"");
}

// --- Pruning ---

#[test]
fn a_token_used_only_inside_a_run_survives_pruning() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "optimize": { "removeUnusedTokens": true },
        "theme": { "tokens": { "colors": { "brand": { "value": "#0057b8" }, "unused": { "value": "#fff" } } } },
        "utilities": { "color": { "className": "c", "values": "colors" } }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(55% 0.18 250), brand)' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert_snapshot!(css, @r"
    @layer tokens {
      :where(:root, :host) {
        --colors-brand: #0057b8;
      }
    }
    @layer utilities {
      .c_fallback\(oklch\(55\%_0\.18_250\)\,_brand\) {
        color: var(--colors-brand);
        color: oklch(55% 0.18 250);
      }
    }
    ");
}

#[test]
fn a_keyframe_used_only_inside_a_run_survives_pruning() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "optimize": { "removeUnusedKeyframes": true },
        "theme": {
            "keyframes": {
                "spin": { "from": { "opacity": "0" }, "to": { "opacity": "1" } },
                "unused": { "from": { "opacity": "0" }, "to": { "opacity": "1" } }
            }
        },
        "utilities": { "animation": {} }
    }));
    let css = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ animation: 'fallback(spin 1s linear, none)' })",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Tokens, StylesheetLayer::Utilities]);

    assert_snapshot!(css, @r"
    @layer tokens {
      @keyframes spin {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    }
    @layer utilities {
      .animation_fallback\(spin_1s_linear\,_none\) {
        animation: none;
        animation: spin 1s linear;
      }
    }
    ");
}

// --- Diagnostics ---

fn diagnostic_report(source: &str) -> String {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" }, "width": {} }
    }));
    compile_output(&config, source, StylesheetOptions::default())
        .diagnostics
        .iter()
        .map(|d| format!("{} [{:?}] {}", d.code, d.severity, d.message))
        .collect::<Vec<_>>()
        .join("\n")
}

#[test]
fn a_single_member_run_reports_bad_arity() {
    let report =
        diagnostic_report("import { css } from '@panda/css'; css({ color: 'fallback(red)' })");

    assert_snapshot!(report, @"css_fallback_arity_invalid [Error] `color: fallback(red)` needs at least 2 values; one value has nothing to fall back to. No CSS was emitted.");
}

#[test]
fn an_unbalanced_run_reports_unbalanced() {
    let report =
        diagnostic_report("import { css } from '@panda/css'; css({ color: 'fallback(red, blue' })");

    assert_snapshot!(report, @"css_fallback_unbalanced [Error] `color: fallback(red, blue` has unbalanced brackets or quotes, so no CSS was emitted.");
}

#[test]
fn a_nested_run_reports_nesting() {
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ color: 'fallback(fallback(a, b), c)' })",
    );

    assert_snapshot!(report, @"css_fallback_nested [Error] `color: fallback(fallback(a, b), c)` nests one fallback inside another. A run is already ordered, so list every value in one `fallback(…)`. No CSS was emitted.");
}

#[test]
fn a_custom_property_run_reports_that_it_cannot_recover() {
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ '--brand': 'fallback(oklch(55% 0.18 250), #0057b8)' })",
    );

    assert_snapshot!(report, @"css_fallback_custom_property [Warning] `--brand` is a custom property, so `fallback(oklch(55% 0.18 250), #0057b8)` cannot fall back reliably. Put the fallback where the variable is read instead, with `var(--brand, …)`.");
}

#[test]
fn a_valid_run_reports_nothing() {
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red)' })",
    );

    assert_snapshot!(report, @"");
}

#[test]
fn an_ordinary_value_reports_nothing() {
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ width: 'min(60rem, 100%)', color: 'red' })",
    );

    assert_snapshot!(report, @"");
}

#[test]
fn the_same_bad_run_is_reported_once() {
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ color: 'fallback(red)' }); css({ color: 'fallback(red)' })",
    );

    assert_snapshot!(report, @"css_fallback_arity_invalid [Error] `color: fallback(red)` needs at least 2 values; one value has nothing to fall back to. No CSS was emitted.");
}

// --- The API in nested positions ---
//
// `css.fallback()` folds at any expression position, so these cover the shapes
// where a value is reached through a different walker than a flat property.

#[test]
fn the_api_folds_three_conditions_deep() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ _hover: { _dark: { md: { color: css.fallback('oklch(60% 0.2 30)', 'red') } } } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      @media (width >= 48rem) {
        [data-theme=dark] .hover\:dark\:md\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\):hover {
          color: red;
          color: oklch(60% 0.2 30);
        }
      }
    }
    ");
}

#[test]
fn the_api_folds_in_each_branch_of_a_conditional_value() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: { base: css.fallback('oklch(60% 0.2 30)', 'red'), _hover: css.fallback('oklch(50% 0.2 260)', 'blue') } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
      .hover\:c_fallback\(oklch\(50\%_0\.2_260\)\,_blue\):hover {
        color: blue;
        color: oklch(50% 0.2 260);
      }
    }
    ");
}

#[test]
fn the_api_folds_inside_a_responsive_array() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ width: [css.fallback('min(60rem, 100%)', '100%'), css.fallback('min(70rem, 75%)', '75%')] })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .width_fallback\(min\(60rem\,_100\%\)\,_100\%\) {
        width: 100%;
        width: min(60rem, 100%);
      }
      @media (width >= 48rem) {
        .md\:width_fallback\(min\(70rem\,_75\%\)\,_75\%\) {
          width: 75%;
          width: min(70rem, 75%);
        }
      }
    }
    ");
}

#[test]
fn the_api_folds_under_a_nested_selector() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ '& > span': { color: css.fallback('oklch(60% 0.2 30)', 'red') } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .\[\&_\>_span\]\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) > span {
        color: red;
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

#[test]
fn the_api_folds_under_a_raw_media_condition() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ '@media print': { color: css.fallback('oklch(60% 0.2 30)', 'red') } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      @media print {
        .\[\@media_print\]\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
          color: red;
          color: oklch(60% 0.2 30);
        }
      }
    }
    ");
}

#[test]
fn the_api_folds_through_a_static_spread() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ ...{ color: css.fallback('oklch(60% 0.2 30)', 'red') } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

#[test]
fn the_api_folds_in_a_cva_base_and_variant() {
    let css = utilities_css(
        "import { css, cva } from '@panda/css'; cva({ base: { color: css.fallback('oklch(60% 0.2 30)', 'red') }, variants: { tone: { loud: { width: css.fallback('min(60rem, 100%)', '75%') } } } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
      .width_fallback\(min\(60rem\,_100\%\)\,_75\%\) {
        width: 75%;
        width: min(60rem, 100%);
      }
    }
    ");
}

#[test]
fn the_api_folds_in_an_sva_slot() {
    let css = utilities_css(
        "import { css, sva } from '@panda/css'; sva({ slots: ['root'], base: { root: { color: css.fallback('oklch(60% 0.2 30)', 'red') } } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
    }
    ");
}

// --- Config recipes ---
//
// A config recipe is JSON, loaded before `styled-system/css` exists, so it
// writes the value form directly. No helper, and `{token.path}` refs resolve
// per member like any other value.

#[test]
fn a_config_recipe_writes_the_value_form_directly() {
    let config = config(serde_json::json!({
        "importMap": { "css": [], "recipe": ["@panda/recipes"], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c", "values": "colors" }, "padding": { "className": "p" } },
        "theme": {
            "tokens": { "colors": { "blue": { "700": { "value": "#1d4ed8" } } } },
            "recipes": {
                "button": {
                    "className": "button",
                    "base": {
                        "color": "fallback(oklch(45% 0.16 250), {colors.blue.700})",
                        "padding": "fallback(clamp(1rem, 3vw, 2rem), 1rem)"
                    }
                }
            }
        }
    }));
    let css = compile_layer_css(
        &config,
        "import { button } from '@panda/recipes'; button()",
        &[StylesheetLayer::Recipes],
    );

    // Two runs in one rule: the second must not collapse into its last member.
    assert_snapshot!(css, @"
    @layer recipes {
      @layer base {
        .button {
          padding: 1rem;
          padding: clamp(1rem, 3vw, 2rem);
          color: var(--colors-blue-700);
          color: oklch(45% 0.16 250);
        }
      }
    }
    ");
}

#[test]
fn several_runs_in_one_rule_each_keep_every_declaration() {
    let config = config(serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "utilities": { "color": { "className": "c" }, "width": {}, "padding": { "className": "p" } }
    }));
    let css = compile_layer_css(
        &config,
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red)', width: 'fallback(min(60rem, 100%), 75%)', padding: 'fallback(clamp(1rem, 3vw, 2rem), 1rem)' })",
        &[StylesheetLayer::Utilities],
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .p_fallback\(clamp\(1rem\,_3vw\,_2rem\)\,_1rem\) {
        padding: 1rem;
        padding: clamp(1rem, 3vw, 2rem);
      }
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
      .width_fallback\(min\(60rem\,_100\%\)\,_75\%\) {
        width: 75%;
        width: min(60rem, 100%);
      }
    }
    ");
}

#[test]
fn two_runs_under_one_media_query_group_without_merging() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ md: { color: 'fallback(oklch(60% 0.2 30), red)', width: 'fallback(min(60rem, 100%), 75%)' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      @media (width >= 48rem) {
        .md\:c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
          color: red;
          color: oklch(60% 0.2 30);
        }
        .md\:width_fallback\(min\(60rem\,_100\%\)\,_75\%\) {
          width: 75%;
          width: min(60rem, 100%);
        }
      }
    }
    ");
}

#[test]
fn a_run_and_a_scalar_on_one_property_stay_separate_atoms() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red)', _hover: { color: 'blue' } })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\) {
        color: red;
        color: oklch(60% 0.2 30);
      }
      .hover\:c_blue:hover {
        color: blue;
      }
    }
    ");
}

// --- Importance ---
//
// Importance belongs to the run, not a member. An important declaration beats
// the others whatever the order, so a partly-important run could never fall
// back.

#[test]
fn a_run_marked_important_marks_every_declaration() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red) !important' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)\,_red\)\! {
        color: red !important;
        color: oklch(60% 0.2 30) !important;
      }
    }
    ");
}

#[test]
fn every_member_marked_important_is_accepted() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30) !important, red !important)' })",
    );

    assert_snapshot!(css, @r"
    @layer utilities {
      .c_fallback\(oklch\(60\%_0\.2_30\)_\!important\,_red_\!important\) {
        color: red !important;
        color: oklch(60% 0.2 30) !important;
      }
    }
    ");
}

#[test]
fn an_important_preferred_member_alone_is_rejected() {
    // `red` would be left unprotected, so a rule elsewhere could beat it.
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30) !important, red)' })",
    );

    assert_snapshot!(report, @"css_fallback_importance_mixed [Error] `color: fallback(oklch(60% 0.2 30) !important, red)` marks only some values `!important`, so the important one always wins and the rest never apply. Mark the whole run instead, with `fallback(…) !important`. No CSS was emitted.");
}

#[test]
fn an_important_fallback_member_alone_is_rejected() {
    // The fallback would always win, so the preferred value never applies.
    let report = diagnostic_report(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red !important)' })",
    );

    assert_snapshot!(report, @"css_fallback_importance_mixed [Error] `color: fallback(oklch(60% 0.2 30), red !important)` marks only some values `!important`, so the important one always wins and the rest never apply. Mark the whole run instead, with `fallback(…) !important`. No CSS was emitted.");
}

#[test]
fn a_rejected_importance_mix_emits_no_css() {
    let css = utilities_css(
        "import { css } from '@panda/css'; css({ color: 'fallback(oklch(60% 0.2 30), red !important)' })",
    );

    assert_snapshot!(css, @"");
}
