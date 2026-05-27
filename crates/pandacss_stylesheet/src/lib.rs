mod emitter;
mod static_css;
mod writer;

use pandacss_config::UserConfig;
use pandacss_encoder::Atom;
use pandacss_project::EncodedRecipesSnapshot;
use serde::Serialize;

#[derive(Debug, Clone, Default)]
pub struct StylesheetOptions {
    pub minify: bool,
    pub optimize: bool,
    pub include_static: bool,
    pub source_map: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetDiagnostic {
    pub message: String,
    pub severity: StylesheetDiagnosticSeverity,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum StylesheetDiagnosticSeverity {
    Warning,
    Error,
}

#[derive(Debug, Clone, Default)]
pub struct StylesheetOutput {
    pub css: String,
    pub source_map: Option<String>,
    pub diagnostics: Vec<StylesheetDiagnostic>,
}

pub struct StylesheetInput<'a> {
    pub config: &'a UserConfig,
    pub atoms: &'a [Atom],
    pub encoded_recipes: &'a EncodedRecipesSnapshot,
}

#[must_use]
pub fn compile(input: StylesheetInput<'_>, options: &StylesheetOptions) -> StylesheetOutput {
    let mut diagnostics = Vec::new();
    let mut atoms = input.atoms.to_vec();

    if options.include_static {
        let generated = static_css::expand(input.config, &mut diagnostics);
        atoms.extend(generated);
    }

    let mut css = emitter::emit(input.config, &atoms, input.encoded_recipes, options.minify);
    if options.optimize {
        css = optimize(css, options.minify);
    }

    StylesheetOutput {
        css,
        source_map: options.source_map.then(String::new),
        diagnostics,
    }
}

fn optimize(css: String, minify: bool) -> String {
    if !minify {
        return css;
    }

    let mut out = String::with_capacity(css.len());
    let mut prev_space = false;
    for ch in css.chars() {
        if ch.is_whitespace() {
            prev_space = true;
            continue;
        }
        if prev_space && !matches!(ch, '{' | '}' | ':' | ';' | ',') {
            out.push(' ');
        }
        prev_space = false;
        out.push(ch);
    }
    out
}
