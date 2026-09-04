//! Theme token variables: declared on the theme root and inherited, so a
//! theme can be nested, stacked with a color mode, or loaded on demand.

use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use crate::common::{compile_output, config};

/// A neutral default plus `matcha` and `gothic`, both pre-generated.
fn themed_config(overrides: serde_json::Value) -> pandacss_config::UserConfig {
    let mut value = serde_json::json!({
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": {
            "dark": ".dark &",
            "light": ".light &",
            "osDark": "@media (prefers-color-scheme: dark)",
            "print": "body.print &",
            "hover": "&:hover"
        },
        "staticCss": { "themes": ["*"] },
        "utilities": { "color": { "className": "c", "values": "colors" } },
        "theme": {
            "breakpoints": { "md": "768px" },
            "tokens": {
                "colors": {
                    "blue": { "value": "#00f" },
                    "green": { "value": "#0f0" },
                    "purple": { "value": "#808" },
                    "white": { "value": "#fff" },
                    "black": { "value": "#000" }
                }
            },
            "semanticTokens": {
                "colors": {
                    "accent": { "value": { "base": "{colors.blue}", "_dark": "{colors.white}" } }
                }
            }
        },
        "themes": {
            "matcha": {
                "semanticTokens": {
                    "colors": { "accent": { "value": { "base": "{colors.green}", "_dark": "{colors.white}" } } }
                }
            },
            "gothic": {
                "semanticTokens": {
                    "colors": {
                        "accent": { "value": { "base": "{colors.purple}", "_dark": "{colors.black}" } }
                    }
                }
            }
        }
    });
    merge(&mut value, overrides);
    config(value)
}

/// Deep-merge `patch` into `target`; a `null` in the patch removes the key.
fn merge(target: &mut serde_json::Value, patch: serde_json::Value) {
    match (target, patch) {
        (serde_json::Value::Object(target), serde_json::Value::Object(patch)) => {
            for (key, value) in patch {
                if value.is_null() {
                    target.remove(&key);
                } else {
                    merge(target.entry(key).or_insert(serde_json::Value::Null), value);
                }
            }
        }
        (target, patch) => *target = patch,
    }
}

fn tokens_layer(config: &pandacss_config::UserConfig, source: &str) -> String {
    compile_output(config, source, StylesheetOptions::default())
        .get_layer_css(&[StylesheetLayer::Tokens])
}

fn on_demand(config: &pandacss_config::UserConfig, theme: &str) -> String {
    pandacss_stylesheet::theme_css(config, theme, false)
        .expect("token dictionary")
        .expect("theme css")
}

#[test]
fn theme_vars_declare_on_the_theme_root_and_inherit() {
    let css = tokens_layer(&themed_config(serde_json::json!({})), "");

    assert!(css.contains("[data-panda-theme=matcha] {"));
    assert!(
        !css.contains("] *)"),
        "theme vars must not be re-declared on descendants:\n{css}"
    );
}

#[test]
fn dark_inside_a_theme_declares_above_on_and_inside_the_root() {
    let css = tokens_layer(
        &themed_config(serde_json::json!({ "themes": { "matcha": null } })),
        "",
    );

    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn light_and_dark_variants_inside_a_theme() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "matcha": null,
            "gothic": {
                "semanticTokens": {
                    "colors": {
                        "accent": { "value": { "base": "{colors.purple}", "_light": "{colors.white}", "_dark": "{colors.black}" } }
                    }
                }
            }
        }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
      .light [data-panda-theme=gothic], [data-panda-theme=gothic].light, [data-panda-theme=gothic] .light {
        --colors-accent: var(--colors-white);
      }
    }
    ");
}

#[test]
fn a_parent_condition_with_several_selectors_meets_the_theme_at_each_boundary() {
    let config = themed_config(serde_json::json!({
        "conditions": { "dark": ".dark &, [data-theme=dark] &" },
        "themes": { "gothic": null }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      :where(.dark, [data-theme=dark]) {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=matcha] {
        --colors-accent: var(--colors-green);
      }
      :where(.dark, [data-theme=dark]) [data-panda-theme=matcha], [data-panda-theme=matcha]:where(.dark, [data-theme=dark]), [data-panda-theme=matcha] :where(.dark, [data-theme=dark]) {
        --colors-accent: var(--colors-white);
      }
    }
    ");
}

#[test]
fn media_condition_inside_a_theme_wraps_the_theme_root() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "matcha": null,
            "gothic": {
                "semanticTokens": {
                    "colors": { "accent": { "value": { "base": "{colors.purple}", "_osDark": "{colors.black}" } } }
                }
            }
        }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
      @media (prefers-color-scheme: dark) {
        [data-panda-theme=gothic] {
          --colors-accent: var(--colors-black);
        }
      }
    }
    ");
}

#[test]
fn dark_then_breakpoint_inside_a_theme_wraps_each_boundary() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "matcha": null,
            "gothic": {
                "semanticTokens": {
                    "colors": {
                        "accent": { "value": { "base": "{colors.purple}", "_dark": { "base": "{colors.black}", "md": "{colors.white}" } } }
                    }
                }
            }
        }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
      @media (width >= 48rem) {
        .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
          --colors-accent: var(--colors-white);
        }
      }
    }
    ");
}

#[test]
fn nested_base_inside_a_condition_keeps_its_value_for_the_default_theme() {
    let config = themed_config(serde_json::json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "accent": { "value": { "base": "{colors.blue}", "_dark": { "base": "{colors.white}", "md": "{colors.black}" } } }
                }
            }
        },
        "themes": { "matcha": null, "gothic": null }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      @media (width >= 48rem) {
        .dark {
          --colors-accent: var(--colors-black);
        }
      }
    }
    ");
}

#[test]
fn every_theme_gets_its_own_root_so_nesting_does_not_depend_on_source_order() {
    let css = tokens_layer(&themed_config(serde_json::json!({})), "");

    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
      [data-panda-theme=matcha] {
        --colors-accent: var(--colors-green);
      }
      .dark [data-panda-theme=matcha], [data-panda-theme=matcha].dark, [data-panda-theme=matcha] .dark {
        --colors-accent: var(--colors-white);
      }
    }
    ");
}

#[test]
fn a_theme_emits_only_the_tokens_it_overrides() {
    let config = themed_config(serde_json::json!({
        "theme": {
            "semanticTokens": {
                "colors": {
                    "canvas": { "value": { "base": "{colors.white}", "_dark": "{colors.black}" } }
                }
            }
        },
        "themes": { "gothic": null }
    }));

    let css = tokens_layer(&config, "");
    assert!(css.contains("--colors-canvas: var(--colors-white)"));
    assert!(!css.contains("[data-panda-theme=matcha] {\n    --colors-canvas"));
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
        --colors-canvas: var(--colors-white);
      }
      .dark {
        --colors-accent: var(--colors-white);
        --colors-canvas: var(--colors-black);
      }
      [data-panda-theme=matcha] {
        --colors-accent: var(--colors-green);
      }
      .dark [data-panda-theme=matcha], [data-panda-theme=matcha].dark, [data-panda-theme=matcha] .dark {
        --colors-accent: var(--colors-white);
      }
    }
    ");
}

#[test]
fn a_theme_name_with_a_dash_keeps_its_root() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "matcha": null,
            "gothic": null,
            "gothic-legacy": {
                "semanticTokens": { "colors": { "accent": { "value": { "base": "{colors.purple}", "_dark": "{colors.black}" } } } }
            }
        }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic-legacy] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic-legacy], [data-panda-theme=gothic-legacy].dark, [data-panda-theme=gothic-legacy] .dark {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn a_parent_that_cannot_compound_skips_the_same_element_form() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "matcha": null,
            "gothic": {
                "semanticTokens": {
                    "colors": { "accent": { "value": { "base": "{colors.purple}", "_print": "{colors.black}" } } }
                }
            }
        }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
      body.print [data-panda-theme=gothic], [data-panda-theme=gothic] body.print {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn a_pseudo_condition_inside_a_theme_applies_to_the_theme_root() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "matcha": null,
            "gothic": {
                "semanticTokens": {
                    "colors": { "accent": { "value": { "base": "{colors.purple}", "_hover": "{colors.black}" } } }
                }
            }
        }
    }));

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
        --colors-accent: var(--colors-black);
      }
      [data-panda-theme=gothic]:hover {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn on_demand_theme_css_scopes_dark_to_the_theme() {
    let css = on_demand(&themed_config(serde_json::json!({})), "gothic");

    assert_snapshot!(css, @"
    [data-panda-theme=gothic] {
      --colors-accent: var(--colors-purple);
    }
    .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
      --colors-accent: var(--colors-black);
    }
    ");
}

#[test]
fn on_demand_theme_css_wraps_media_conditions() {
    let config = themed_config(serde_json::json!({
        "themes": {
            "gothic": {
                "semanticTokens": {
                    "colors": { "accent": { "value": { "base": "{colors.purple}", "_osDark": "{colors.black}" } } }
                }
            }
        }
    }));

    assert_snapshot!(on_demand(&config, "gothic"), @"
    [data-panda-theme=gothic] {
      --colors-accent: var(--colors-purple);
    }
    .dark [data-panda-theme=gothic], [data-panda-theme=gothic].dark, [data-panda-theme=gothic] .dark {
      --colors-accent: var(--colors-black);
    }
    @media (prefers-color-scheme: dark) {
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn on_demand_and_static_output_use_the_same_selectors() {
    let config = themed_config(serde_json::json!({}));
    let on_demand = on_demand(&config, "gothic");
    let static_css = tokens_layer(&config, "");

    for line in on_demand.lines().filter(|line| line.ends_with('{')) {
        assert!(
            static_css.contains(line.trim()),
            "missing from static css: {line}"
        );
    }
}

#[test]
fn a_theme_condition_on_atomic_styles_still_matches_the_whole_subtree() {
    let css = compile_output(
        &themed_config(serde_json::json!({})),
        "import { css } from '@panda/css'; css({ _themeGothic: { color: 'purple' } });",
        StylesheetOptions::default(),
    )
    .get_layer_css(&[StylesheetLayer::Utilities]);

    assert_snapshot!(css, @r"
    @layer utilities {
      .themeGothic\:c_purple:where([data-panda-theme=gothic], [data-panda-theme=gothic] *) {
        color: var(--colors-purple);
      }
    }
    ");
}

fn gothic_with(
    conditions: &serde_json::Value,
    value: &serde_json::Value,
) -> pandacss_config::UserConfig {
    themed_config(serde_json::json!({
        "conditions": conditions,
        "themes": {
            "matcha": null,
            "gothic": { "semanticTokens": { "colors": { "accent": { "value": value } } } }
        }
    }))
}

#[test]
fn a_child_combinator_parent_only_meets_the_theme_from_above() {
    let config = gothic_with(
        &serde_json::json!({ "dark": ".dark > &" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": "{colors.black}" }),
    );

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark > {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark > [data-panda-theme=gothic] {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn a_sibling_combinator_parent_only_meets_the_theme_from_above() {
    let config = gothic_with(
        &serde_json::json!({ "dark": ".toggle:checked ~ &" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": "{colors.black}" }),
    );

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .toggle:checked ~ {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .toggle:checked ~ [data-panda-theme=gothic] {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn an_attribute_parent_with_a_comma_in_its_value_stays_intact() {
    let config = gothic_with(
        &serde_json::json!({ "dark": "[data-mode=\"dark, dim\"] &" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": "{colors.black}" }),
    );

    assert_snapshot!(tokens_layer(&config, ""), @r#"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      [data-mode="dark, dim"] {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      [data-mode="dark, dim"] [data-panda-theme=gothic], [data-panda-theme=gothic][data-mode="dark, dim"], [data-panda-theme=gothic] [data-mode="dark, dim"] {
        --colors-accent: var(--colors-black);
      }
    }
    "#);
}

#[test]
fn a_root_parent_inside_a_theme() {
    let config = gothic_with(
        &serde_json::json!({ "dark": ":root &" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": "{colors.black}" }),
    );

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      :root {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      :root [data-panda-theme=gothic], [data-panda-theme=gothic]:root, [data-panda-theme=gothic] :root {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn a_universal_parent_never_re_declares_on_every_descendant() {
    let config = gothic_with(
        &serde_json::json!({ "dark": "* &" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": "{colors.black}" }),
    );

    let css = tokens_layer(&config, "");
    assert!(!css.contains("[data-panda-theme=gothic] *"), "{css}");
    assert_snapshot!(css, @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      * {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      * [data-panda-theme=gothic] {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn two_parent_conditions_inside_a_theme_expand_to_every_boundary_pair() {
    let config = gothic_with(
        &serde_json::json!({ "dark": ".dark &", "hc": ".hc &" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": { "_hc": "{colors.black}" } }),
    );

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .hc .dark [data-panda-theme=gothic], .dark [data-panda-theme=gothic].hc, .dark [data-panda-theme=gothic] .hc, .hc [data-panda-theme=gothic].dark, [data-panda-theme=gothic].dark.hc, [data-panda-theme=gothic].dark .hc, .hc [data-panda-theme=gothic] .dark, [data-panda-theme=gothic] .dark.hc, [data-panda-theme=gothic] .dark .hc {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}

#[test]
fn an_ampersand_in_the_middle_of_a_parent_condition_inside_a_theme() {
    let config = gothic_with(
        &serde_json::json!({ "dark": ".dark & .panel" }),
        &serde_json::json!({ "base": "{colors.purple}", "_dark": "{colors.black}" }),
    );

    assert_snapshot!(tokens_layer(&config, ""), @"
    @layer tokens {
      :where(:root, :host) {
        --colors-blue: #00f;
        --colors-green: #0f0;
        --colors-purple: #808;
        --colors-white: #fff;
        --colors-black: #000;
        --breakpoints-md: 768px;
        --sizes-breakpoint-md: 768px;
        --colors-accent: var(--colors-blue);
      }
      .dark .panel {
        --colors-accent: var(--colors-white);
      }
      [data-panda-theme=gothic] {
        --colors-accent: var(--colors-purple);
      }
      .dark [data-panda-theme=gothic] .panel {
        --colors-accent: var(--colors-black);
      }
    }
    ");
}
