use pandacss_stylesheet::{StylesheetOptions, visit_animation_names};
use pandacss_tokens::{Token, TokenCategory, TokenDictionary};
use serde_json::json;

use crate::common::{compile_keyframes_output, compile_output, config, split_output};

fn animation_config() -> pandacss_config::UserConfig {
    config(json!({
        "optimize": { "removeUnusedKeyframes": true },
        "importMap": { "css": ["@panda/css"], "recipe": [], "pattern": [], "jsx": [], "tokens": [] },
        "conditions": { "dark": "&:where([data-theme=dark], [data-theme=dark] *)" },
        "utilities": { "animation": { "values": "animations", "className": "anim" } },
        "theme": {
            "tokens": { "animations": {
                "pulse": { "value": "pulse 2s infinite" },
                "slideIn": { "value": "slide 300ms, fade 300ms" },
                "unused": { "value": "unused 1s" }
            } },
            "semanticTokens": { "animations": {
                "alias": { "value": "{animations.slideIn}" },
                "motion": { "value": { "base": "{animations.pulse}", "_dark": "{animations.alias}" } },
                "onlyDark": { "value": { "_dark": "{animations.alias}" } }
            } },
            "keyframes": {
                "pulse": { "to": { "opacity": 1 } },
                "slide": { "to": { "transform": "none" } },
                "fade": { "to": { "opacity": 1 } },
                "unused": { "to": { "opacity": 0 } }
            }
        }
    }))
}

fn keyframe_names(css: &str) -> Vec<&str> {
    let mut names = css
        .split("@keyframes ")
        .skip(1)
        .map(|part| part.split_whitespace().next().expect("keyframe name"))
        .collect::<Vec<_>>();
    names.sort_unstable();
    names
}

#[test]
fn animation_tokens_keep_keyframes_in_all_output_modes() {
    let source = "import { css } from '@panda/css'; css({ animation: 'pulse' }); css({ animation: 'slideIn' });";
    for remove_tokens in [false, true] {
        let mut config = animation_config();
        config.optimize.remove_unused_tokens = remove_tokens;
        let output = compile_output(&config, source, StylesheetOptions::default());
        assert_eq!(keyframe_names(&output.css), ["fade", "pulse", "slide"]);
        assert!(output.css.contains("animation: var(--animations-pulse)"));
        assert!(output.css.contains("animation: var(--animations-slide-in)"));
        assert!(output.diagnostics.is_empty());

        let keyframes = compile_keyframes_output(&config, source, StylesheetOptions::default());
        assert_eq!(keyframe_names(&keyframes.css), ["fade", "pulse", "slide"]);

        let files = split_output(&config, source, StylesheetOptions::default());
        let css = files
            .iter()
            .map(|file| file.code.as_str())
            .collect::<String>();
        assert_eq!(keyframe_names(&css), ["fade", "pulse", "slide"]);
    }
}

#[test]
fn animation_tokens_follow_aliases_and_all_conditions() {
    for (token, expected) in [
        ("motion", vec!["fade", "pulse", "slide"]),
        ("onlyDark", vec!["fade", "slide"]),
    ] {
        let config = animation_config();
        let source =
            format!("import {{ css }} from '@panda/css'; css({{ animation: '{token}' }});");
        let output = compile_output(&config, &source, StylesheetOptions::default());
        assert_eq!(keyframe_names(&output.css), expected);
    }
}

#[test]
fn animation_tokens_use_actual_prefixed_and_hashed_variable_names() {
    let mut config = animation_config();
    config.prefix = serde_json::from_value(json!({ "cssVar": "acme" })).unwrap();
    config.hash = serde_json::from_value(json!({ "cssVar": true })).unwrap();
    let output = compile_output(
        &config,
        "import { css } from '@panda/css'; css({ animation: 'motion' });",
        StylesheetOptions::default(),
    );
    assert_eq!(keyframe_names(&output.css), ["fade", "pulse", "slide"]);
}

#[test]
fn animation_tokens_in_global_and_recipe_styles_keep_keyframes() {
    let mut config = animation_config();
    config.global_css = json!({ "body": { "animation": "slideIn" } });
    let source = "import { cva } from '@panda/css'; cva({ base: { animation: 'pulse' } });";
    let output = compile_output(&config, source, StylesheetOptions::default());
    assert_eq!(keyframe_names(&output.css), ["fade", "pulse", "slide"]);
}

#[test]
fn animation_variable_cycles_terminate_and_fallbacks_are_kept() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "animations.a",
            "var(--b)",
            "var(--a)",
            TokenCategory::Animations,
        ))
        .insert(Token::new(
            "animations.b",
            "var(--a, fade 1s)",
            "var(--b)",
            TokenCategory::Animations,
        ))
        .build();
    let mut names = Vec::new();
    visit_animation_names(
        "var(--missing, var(--a)), pulse 2s",
        Some(&tokens),
        |name| {
            if ["fade", "pulse"].contains(&name) {
                names.push(name.to_owned());
            }
        },
    );
    names.sort();
    assert_eq!(names, ["fade", "pulse"]);
}

#[test]
fn animation_variable_scanning_ignores_quoted_and_commented_references() {
    let tokens = TokenDictionary::builder()
        .insert(Token::new(
            "animations.a",
            "unused 1s",
            "var(--a)",
            TokenCategory::Animations,
        ))
        .build();
    let mut names = Vec::new();
    visit_animation_names(
        "'var(--a)' 1s, pulse 2s /* var(--a) */",
        Some(&tokens),
        |name| {
            if ["pulse", "unused"].contains(&name) {
                names.push(name.to_owned());
            }
        },
    );
    assert_eq!(names, ["pulse"]);
}
