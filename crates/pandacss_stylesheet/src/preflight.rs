//! Static preflight (reset) CSS data.
//!
//! Mirrors `packages/generator/src/artifacts/css/reset-css.ts`. Properties are
//! pre-hyphenated and values are stored as `&'static str`, so emission is a
//! zero-allocation walk over slices that live in `.rodata` — no JSON parse,
//! no `String` per leaf, no `Vec` bookkeeping.
//!
//! The nested `@supports` block in v1's `::placeholder` definition is hoisted
//! into its own top-level at-rule (semantically equivalent CSS, simpler data).

use std::borrow::Cow;

use pandacss_config::PreflightLevel;

use crate::{selector::ScopeMode, writer::CssWriter};

/// One CSS rule: `selector { declarations }`.
pub(crate) struct PreflightRule {
    pub selector: &'static str,
    pub declarations: &'static [(&'static str, &'static str)],
}

/// A rule nested inside a top-level at-rule.
/// Only used for the placeholder `@supports` carve-out today.
pub(crate) struct PreflightAtRule {
    pub prelude: &'static str,
    pub rule: PreflightRule,
}

/// Emit the reset, optionally scoped. `scope` is a selector (e.g. `.pd-reset`);
/// `level` controls whether the reset targets descendants (`parent`) or the
/// scoped element itself (`element`). Mirrors `reset-css.ts`'s scope handling.
pub(crate) fn write(writer: &mut CssWriter, scope: Option<&str>, level: PreflightLevel) {
    let mode = match level {
        PreflightLevel::Parent => ScopeMode::Parent,
        PreflightLevel::Element => ScopeMode::Element,
    };

    for rule in RULES {
        write_rule(writer, rule, scope, mode);
    }
    for at_rule in AT_RULES {
        writer.at_rule(at_rule.prelude, |writer| {
            write_rule(writer, &at_rule.rule, scope, mode);
        });
    }
}

fn write_rule(
    writer: &mut CssWriter,
    rule: &PreflightRule,
    scope: Option<&str>,
    mode: ScopeMode,
) {
    let selector = match scope {
        None => Cow::Borrowed(rule.selector),
        Some(scope) => Cow::Owned(crate::selector::scope_selector(rule.selector, scope, mode)),
    };
    writer.rule(selector.as_ref(), |writer| {
        for (property, value) in rule.declarations {
            writer.declaration(property, value, false);
        }
    });
}

/// Top-level rules in v1's emit order (the `reset` definition then the
/// `scoped` block, merged via `Object.assign`).
static RULES: &[PreflightRule] = &[
    PreflightRule {
        selector: "html, :host",
        declarations: &[
            ("line-height", "1.5"),
            (
                "--font-fallback",
                "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
            ),
            ("-webkit-text-size-adjust", "100%"),
            ("-webkit-font-smoothing", "antialiased"),
            ("-moz-osx-font-smoothing", "grayscale"),
            ("-moz-tab-size", "4"),
            ("tab-size", "4"),
            (
                "font-family",
                "var(--global-font-body, var(--font-fallback))",
            ),
            ("-webkit-tap-highlight-color", "transparent"),
        ],
    },
    PreflightRule {
        selector: "*, ::before, ::after, ::backdrop, ::file-selector-button",
        declarations: &[
            ("margin", "0px"),
            ("padding", "0px"),
            ("box-sizing", "border-box"),
            ("border-width", "0px"),
            ("border-style", "solid"),
            ("border-color", "var(--global-color-border, currentcolor)"),
        ],
    },
    PreflightRule {
        selector: "hr",
        declarations: &[
            ("height", "0px"),
            ("color", "inherit"),
            ("border-top-width", "1px"),
        ],
    },
    PreflightRule {
        selector: "body",
        declarations: &[("height", "100%"), ("line-height", "inherit")],
    },
    PreflightRule {
        selector: "img",
        declarations: &[("border-style", "none")],
    },
    PreflightRule {
        selector: "img, svg, video, canvas, audio, iframe, embed, object",
        declarations: &[("display", "block"), ("vertical-align", "middle")],
    },
    PreflightRule {
        selector: "img, video",
        declarations: &[("max-width", "100%"), ("height", "auto")],
    },
    PreflightRule {
        selector: "h1, h2, h3, h4, h5, h6",
        declarations: &[
            ("font-size", "inherit"),
            ("font-weight", "inherit"),
            ("text-wrap", "balance"),
        ],
    },
    PreflightRule {
        selector: "p, h1, h2, h3, h4, h5, h6",
        declarations: &[("overflow-wrap", "break-word")],
    },
    PreflightRule {
        selector: "ol, ul, menu",
        declarations: &[("list-style", "none")],
    },
    PreflightRule {
        selector: "button, input:where([type='button'], [type='reset'], [type='submit']), ::file-selector-button",
        declarations: &[("appearance", "button")],
    },
    PreflightRule {
        selector: "button, input, optgroup, select, textarea, ::file-selector-button",
        declarations: &[
            ("font", "inherit"),
            ("font-feature-settings", "inherit"),
            ("font-variation-settings", "inherit"),
            ("letter-spacing", "inherit"),
            ("color", "inherit"),
            ("background", "transparent"),
        ],
    },
    PreflightRule {
        selector: "::placeholder",
        declarations: &[
            ("opacity", "1"),
            ("--placeholder-fallback", "rgba(0, 0, 0, 0.5)"),
            (
                "color",
                "var(--global-color-placeholder, var(--placeholder-fallback))",
            ),
        ],
    },
    PreflightRule {
        selector: "::selection",
        declarations: &[(
            "background-color",
            "var(--global-color-selection, rgba(0, 115, 255, 0.3))",
        )],
    },
    PreflightRule {
        selector: "textarea",
        declarations: &[("resize", "vertical")],
    },
    PreflightRule {
        selector: "table",
        declarations: &[
            ("text-indent", "0px"),
            ("border-color", "inherit"),
            ("border-collapse", "collapse"),
        ],
    },
    PreflightRule {
        selector: "summary",
        declarations: &[("display", "list-item")],
    },
    PreflightRule {
        selector: "small",
        declarations: &[("font-size", "80%")],
    },
    PreflightRule {
        selector: "sub, sup",
        declarations: &[
            ("font-size", "75%"),
            ("line-height", "0"),
            ("position", "relative"),
            ("vertical-align", "baseline"),
        ],
    },
    PreflightRule {
        selector: "sub",
        declarations: &[("bottom", "-0.25em")],
    },
    PreflightRule {
        selector: "sup",
        declarations: &[("top", "-0.5em")],
    },
    PreflightRule {
        selector: "dialog",
        declarations: &[("padding", "0px")],
    },
    PreflightRule {
        selector: "a",
        declarations: &[("color", "inherit"), ("text-decoration", "inherit")],
    },
    PreflightRule {
        selector: "abbr:where([title])",
        declarations: &[("text-decoration", "underline dotted")],
    },
    PreflightRule {
        selector: "b, strong",
        declarations: &[("font-weight", "bolder")],
    },
    PreflightRule {
        selector: "code, kbd, samp, pre",
        declarations: &[
            (
                "--font-mono-fallback",
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'",
            ),
            (
                "font-family",
                "var(--global-font-mono, var(--font-mono-fallback))",
            ),
            ("font-size", "1em"),
            ("font-feature-settings", "normal"),
            ("font-variation-settings", "normal"),
        ],
    },
    PreflightRule {
        selector: "progress",
        declarations: &[("vertical-align", "baseline")],
    },
    PreflightRule {
        selector: "::-webkit-search-decoration, ::-webkit-search-cancel-button",
        declarations: &[("-webkit-appearance", "none")],
    },
    PreflightRule {
        selector: "::-webkit-inner-spin-button, ::-webkit-outer-spin-button",
        declarations: &[("height", "auto")],
    },
    PreflightRule {
        selector: ":-moz-ui-invalid",
        declarations: &[("box-shadow", "none")],
    },
    PreflightRule {
        selector: ":-moz-focusring",
        declarations: &[("outline", "auto")],
    },
    PreflightRule {
        selector: "[hidden]:where(:not([hidden='until-found']))",
        declarations: &[("display", "none !important")],
    },
];

/// At-rule carve-outs. Today: only the placeholder color-mix fallback that
/// v1 nests inside `::placeholder` via `@supports`.
static AT_RULES: &[PreflightAtRule] = &[PreflightAtRule {
    prelude: "@supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px)",
    rule: PreflightRule {
        selector: "::placeholder",
        declarations: &[(
            "--placeholder-fallback",
            "color-mix(in oklab, currentcolor 50%, transparent)",
        )],
    },
}];
