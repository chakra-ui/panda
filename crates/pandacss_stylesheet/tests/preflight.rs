mod common;

use insta::assert_snapshot;
use pandacss_stylesheet::{StylesheetLayer, StylesheetOptions};

use common::{compile_css, compile_layer_css, compile_output, config};

#[test]
fn preflight_disabled_by_default() {
    let config = config(serde_json::json!({}));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;");
}

#[test]
fn preflight_false_emits_no_reset_layer() {
    let config = config(serde_json::json!({ "preflight": false }));
    let css = compile_css(&config, "");
    assert_snapshot!(css, @"@layer reset, base, tokens, recipes, utilities;");
}

#[test]
#[allow(
    clippy::too_many_lines,
    reason = "exhaustive preflight reset-CSS fixture"
)]
fn preflight_true_emits_full_reset_layer() {
    let config = config(serde_json::json!({ "preflight": true }));
    let reset = compile_layer_css(&config, "", &[StylesheetLayer::Reset]);
    assert_snapshot!(reset, @r"
    @layer reset {
      html, :host {
        line-height: 1.5;
        --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        -webkit-text-size-adjust: 100%;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -moz-tab-size: 4;
        tab-size: 4;
        font-family: var(--global-font-body, var(--font-fallback));
        -webkit-tap-highlight-color: transparent;
      }
      *, ::before, ::after, ::backdrop, ::file-selector-button {
        margin: 0px;
        padding: 0px;
        box-sizing: border-box;
        border-width: 0px;
        border-style: solid;
        border-color: var(--global-color-border, currentcolor);
      }
      hr {
        height: 0px;
        color: inherit;
        border-top-width: 1px;
      }
      body {
        height: 100%;
        line-height: inherit;
      }
      img {
        border-style: none;
      }
      img, svg, video, canvas, audio, iframe, embed, object {
        display: block;
        vertical-align: middle;
      }
      img, video {
        max-width: 100%;
        height: auto;
      }
      h1, h2, h3, h4, h5, h6 {
        font-size: inherit;
        font-weight: inherit;
        text-wrap: balance;
      }
      p, h1, h2, h3, h4, h5, h6 {
        overflow-wrap: break-word;
      }
      ol, ul, menu {
        list-style: none;
      }
      button, input:where([type='button'], [type='reset'], [type='submit']), ::file-selector-button {
        appearance: button;
      }
      button, input, optgroup, select, textarea, ::file-selector-button {
        font: inherit;
        font-feature-settings: inherit;
        font-variation-settings: inherit;
        letter-spacing: inherit;
        color: inherit;
        background: transparent;
      }
      ::placeholder {
        opacity: 1;
        --placeholder-fallback: rgba(0, 0, 0, 0.5);
        color: var(--global-color-placeholder, var(--placeholder-fallback));
      }
      ::selection {
        background-color: var(--global-color-selection, rgba(0, 115, 255, 0.3));
      }
      textarea {
        resize: vertical;
      }
      table {
        text-indent: 0px;
        border-color: inherit;
        border-collapse: collapse;
      }
      summary {
        display: list-item;
      }
      small {
        font-size: 80%;
      }
      sub, sup {
        font-size: 75%;
        line-height: 0;
        position: relative;
        vertical-align: baseline;
      }
      sub {
        bottom: -0.25em;
      }
      sup {
        top: -0.5em;
      }
      dialog {
        padding: 0px;
      }
      a {
        color: inherit;
        text-decoration: inherit;
      }
      abbr:where([title]) {
        text-decoration: underline dotted;
      }
      b, strong {
        font-weight: bolder;
      }
      code, kbd, samp, pre {
        --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
        font-family: var(--global-font-mono, var(--font-mono-fallback));
        font-size: 1em;
        font-feature-settings: normal;
        font-variation-settings: normal;
      }
      progress {
        vertical-align: baseline;
      }
      ::-webkit-search-decoration, ::-webkit-search-cancel-button {
        -webkit-appearance: none;
      }
      ::-webkit-inner-spin-button, ::-webkit-outer-spin-button {
        height: auto;
      }
      :-moz-ui-invalid {
        box-shadow: none;
      }
      :-moz-focusring {
        outline: auto;
      }
      [hidden]:where(:not([hidden='until-found'])) {
        display: none !important;
      }
      @supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px) {
        ::placeholder {
          --placeholder-fallback: color-mix(in oklab, currentcolor 50%, transparent);
        }
      }
    }
    ");
}

#[test]
fn preflight_sits_before_base_tokens_recipes_utilities() {
    let config = config(serde_json::json!({
        "preflight": true,
        "globalCss": { "body": { "margin": "0" } },
        "theme": {
            "tokens": { "colors": { "red": { "value": "#f00" } } }
        }
    }));
    let css = compile_css(&config, "");
    let reset = css.find("@layer reset {").expect("reset");
    let base = css.find("@layer base {").expect("base");
    let tokens = css.find("@layer tokens {").expect("tokens");
    assert!(reset < base, "reset must precede base");
    assert!(base < tokens, "base must precede tokens");
}

#[test]
fn preflight_options_with_defaults_emit_default_block_without_diagnostics() {
    // `preflight: {}` (no scope, no level) is equivalent to `preflight: true`.
    let config = config(serde_json::json!({ "preflight": {} }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    assert_snapshot!(format!("{} diagnostics", output.diagnostics.len()), @"0 diagnostics");
    let reset = output
        .layer_css(StylesheetLayer::Reset)
        .expect("reset layer present");
    assert!(reset.starts_with("@layer reset {\n  html, :host {"));
}

#[test]
fn preflight_scope_emits_no_diagnostic() {
    // scope/level are supported now — no "unsupported" warning.
    let config = config(serde_json::json!({
        "preflight": { "scope": ".pd-reset" }
    }));
    let output = compile_output(&config, "", StylesheetOptions::default());
    assert_snapshot!(format!("{} diagnostics", output.diagnostics.len()), @"0 diagnostics");
}

#[test]
fn preflight_minified_strips_whitespace() {
    let config = config(serde_json::json!({ "preflight": true }));
    let css = compile_output(
        &config,
        "",
        StylesheetOptions {
            minify: true,
            ..StylesheetOptions::default()
        },
    )
    .css;
    // Snapshot a window around the html/body region rather than the whole
    // ~3KB minified blob; the rest is exercised by the pretty snapshot above.
    let window = &css[..200.min(css.len())];
    assert_snapshot!(window, @"@layer reset, base, tokens, recipes, utilities;@layer reset{html, :host{line-height:1.5;--font-fallback:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue");
    assert!(
        !css.contains('\n'),
        "minified output must not contain newlines"
    );
}

#[test]
fn preflight_parent_scope_prefixes_descendant_selectors() {
    let config = config(serde_json::json!({ "preflight": { "scope": ".pd-reset" } }));
    let reset = compile_layer_css(&config, "", &[StylesheetLayer::Reset]);

    // Root rule collapses to the scope; no bare html/:host.
    assert!(reset.contains(".pd-reset {"), "root rule scoped:\n{reset}");
    assert!(
        !reset.contains("html, :host"),
        "no bare root rule:\n{reset}"
    );
    // Other rules are descendant-prefixed, distributed over each comma part.
    assert!(
        reset.contains(".pd-reset *, .pd-reset ::before, .pd-reset ::after"),
        "descendant prefix:\n{reset}",
    );
    // Internal commas (`:where([type='button'], …)`) are preserved.
    assert!(
        reset.contains(".pd-reset input:where([type='button'], [type='reset'], [type='submit'])"),
        "paren-aware split:\n{reset}",
    );
    // The @supports placeholder carve-out is scoped too.
    assert!(
        reset.contains(".pd-reset ::placeholder"),
        "supports placeholder:\n{reset}"
    );
}

#[test]
fn preflight_element_scope_compounds_except_standalone_pseudo_elements() {
    let config =
        config(serde_json::json!({ "preflight": { "scope": ".pd-reset", "level": "element" } }));
    let reset = compile_layer_css(&config, "", &[StylesheetLayer::Reset]);

    assert!(reset.contains(".pd-reset {"), "root rule scoped:\n{reset}");
    // Compound-append for the universal rule (a multi-part list).
    assert!(
        reset.contains("*.pd-reset, ::before.pd-reset, ::after.pd-reset"),
        "compound append:\n{reset}",
    );
    // Standalone pseudo-element rules fall back to descendant (a pseudo-element
    // can't carry a trailing compound).
    assert!(
        reset.contains(".pd-reset ::placeholder"),
        "placeholder descendant:\n{reset}"
    );
    assert!(
        reset.contains(".pd-reset ::selection"),
        "selection descendant:\n{reset}"
    );
    // …but a multi-part pseudo-element list stays compound.
    assert!(
        reset.contains(
            "::-webkit-search-decoration.pd-reset, ::-webkit-search-cancel-button.pd-reset"
        ),
        "multi pseudo compound:\n{reset}",
    );
}
