//! `pandacss_extractor::X ↔ X` conversion between core types and the NAPI mirror
//! types in sibling modules. Centralized so NAPI entrypoints stay clean.

use crate::{
    Diagnostic, DiagnosticSeverity, ExtractedCall, ExtractedJsx, ImportKind, ImportRecord,
    ImportSpecifier, ImportSpecifierKind, MatchCategory, MatchedImport, Matcher, Matchers, Span,
};

pub(crate) fn convert_span(span: pandacss_extractor::Span) -> Span {
    Span {
        start: span.start,
        end: span.end,
    }
}

pub(crate) fn convert_severity(s: pandacss_extractor::DiagnosticSeverity) -> DiagnosticSeverity {
    match s {
        pandacss_extractor::DiagnosticSeverity::Error => DiagnosticSeverity::Error,
        pandacss_extractor::DiagnosticSeverity::Warning => DiagnosticSeverity::Warning,
    }
}

pub(crate) fn convert_diagnostic(d: pandacss_extractor::Diagnostic) -> Diagnostic {
    Diagnostic {
        message: d.message,
        severity: convert_severity(d.severity),
        span: d.span.map(convert_span),
        location: d.location.map(convert_range),
    }
}

fn convert_location(loc: pandacss_extractor::SourceLocation) -> crate::SourceLocation {
    crate::SourceLocation {
        line: loc.line,
        column: loc.column,
    }
}

fn convert_range(range: pandacss_extractor::SourceRange) -> crate::SourceRange {
    crate::SourceRange {
        start: convert_location(range.start),
        end: convert_location(range.end),
    }
}

pub(crate) fn convert_kind(k: pandacss_extractor::ImportKind) -> ImportKind {
    match k {
        pandacss_extractor::ImportKind::SideEffect => ImportKind::SideEffect,
        pandacss_extractor::ImportKind::Value => ImportKind::Value,
    }
}

pub(crate) fn convert_specifier_kind(
    k: pandacss_extractor::ImportSpecifierKind,
) -> ImportSpecifierKind {
    match k {
        pandacss_extractor::ImportSpecifierKind::Named => ImportSpecifierKind::Named,
        pandacss_extractor::ImportSpecifierKind::Default => ImportSpecifierKind::Default,
        pandacss_extractor::ImportSpecifierKind::Namespace => ImportSpecifierKind::Namespace,
    }
}

pub(crate) fn convert_specifier(specifier: pandacss_extractor::ImportSpecifier) -> ImportSpecifier {
    ImportSpecifier {
        kind: convert_specifier_kind(specifier.kind),
        imported: specifier.imported,
        local: specifier.local,
        type_only: specifier.type_only,
        span: convert_span(specifier.span),
    }
}

pub(crate) fn convert_record(record: pandacss_extractor::ImportRecord) -> ImportRecord {
    ImportRecord {
        module: record.module,
        kind: convert_kind(record.kind),
        type_only: record.type_only,
        specifiers: record
            .specifiers
            .into_iter()
            .map(convert_specifier)
            .collect(),
        span: convert_span(record.span),
    }
}

pub(crate) fn convert_category(c: pandacss_extractor::MatchCategory) -> MatchCategory {
    match c {
        pandacss_extractor::MatchCategory::Css => MatchCategory::Css,
        pandacss_extractor::MatchCategory::Recipe => MatchCategory::Recipe,
        pandacss_extractor::MatchCategory::Pattern => MatchCategory::Pattern,
        pandacss_extractor::MatchCategory::Jsx => MatchCategory::Jsx,
        pandacss_extractor::MatchCategory::Tokens => MatchCategory::Tokens,
    }
}

pub(crate) fn to_matched(m: MatchedImport) -> pandacss_extractor::MatchedImport {
    pandacss_extractor::MatchedImport {
        category: match m.category {
            MatchCategory::Css => pandacss_extractor::MatchCategory::Css,
            MatchCategory::Recipe => pandacss_extractor::MatchCategory::Recipe,
            MatchCategory::Pattern => pandacss_extractor::MatchCategory::Pattern,
            MatchCategory::Jsx => pandacss_extractor::MatchCategory::Jsx,
            MatchCategory::Tokens => pandacss_extractor::MatchCategory::Tokens,
        },
        module: m.module,
        name: m.name,
        alias: m.alias,
        kind: match m.kind {
            ImportSpecifierKind::Named => pandacss_extractor::ImportSpecifierKind::Named,
            ImportSpecifierKind::Default => pandacss_extractor::ImportSpecifierKind::Default,
            ImportSpecifierKind::Namespace => pandacss_extractor::ImportSpecifierKind::Namespace,
        },
    }
}

pub(crate) fn matched_record(m: pandacss_extractor::MatchedImport) -> MatchedImport {
    MatchedImport {
        category: convert_category(m.category),
        module: m.module,
        name: m.name,
        alias: m.alias,
        kind: convert_specifier_kind(m.kind),
    }
}

pub(crate) fn to_core_matcher(m: Matcher) -> pandacss_extractor::Matcher {
    pandacss_extractor::Matcher {
        modules: m.modules,
        names: match m.names {
            None => pandacss_extractor::NameMatcher::Any,
            Some(list) => pandacss_extractor::NameMatcher::only(list),
        },
    }
}

/// JS-shaped `Matchers` (token dictionary as a child field, for backward
/// JS-wire compat) → core `ExtractorConfig`.
pub(crate) fn to_core_config(m: Matchers) -> pandacss_extractor::ExtractorConfig {
    let token_dictionary = m
        .token_dictionary
        .clone()
        .map(to_core_token_dictionary)
        .map(std::sync::Arc::new);
    pandacss_extractor::ExtractorConfig {
        matchers: to_core_matchers(m),
        jsx: pandacss_extractor::JsxExtractionConfig::default(),
        token_dictionary,
        // Cross-file resolution isn't on the flat `Matchers` shape — the
        // session class wires it up explicitly. Free-function callers
        // extract single files anyway, so a per-call cache wouldn't help.
        cross_file: None,
    }
}

pub(crate) fn to_core_matchers(m: Matchers) -> pandacss_extractor::Matchers {
    pandacss_extractor::Matchers {
        css: to_core_matcher(m.css),
        recipe: to_core_matcher(m.recipe),
        pattern: to_core_matcher(m.pattern),
        jsx: m.jsx.map(to_core_matcher),
        tokens: to_core_matcher(m.tokens),
        jsx_factories: m.jsx_factories,
    }
}

// JS passes two parallel `path → string` maps; re-key them into the
// structured `Token` records the `tokens` crate uses.
pub(crate) fn to_core_token_dictionary(
    d: crate::TokenDictionary,
) -> pandacss_tokens::TokenDictionary {
    pandacss_tokens::TokenDictionary::builder()
        .extend_flat(d.values, &d.vars)
        .build()
}

// PERF(port): every `Literal::to_json()` materializes a `serde_json::Value`
// that crosses the NAPI boundary. This is fine for the tooling-shaped
// `extract*()` APIs (JS callers want JSON), but the production hot path
// (`compile()`) must never reach here — the engine keeps Literal → encoder
// → stylesheet emitter in Rust and returns compact CSS/manifest. Keep
// this conversion confined to the tooling APIs; do not call it from
// inside `compile()` when the real pipeline lands.
pub(crate) fn to_call(c: pandacss_extractor::ExtractedCall) -> ExtractedCall {
    ExtractedCall {
        category: convert_category(c.category),
        name: c.name,
        alias: c.alias,
        data: c
            .data
            .into_iter()
            .map(|opt| match opt {
                Some(lit) => crate::ExtractedArg::value(lit.to_json()),
                None => crate::ExtractedArg::missing(),
            })
            .collect(),
        span: convert_span(c.span),
    }
}

pub(crate) fn to_jsx(j: pandacss_extractor::ExtractedJsx) -> ExtractedJsx {
    ExtractedJsx {
        category: convert_category(j.category),
        name: j.name,
        alias: j.alias,
        data: j.data.to_json(),
        span: convert_span(j.span),
    }
}

/// Convert an `AtomValue` to a JSON value that JS consumers expect.
///
/// `pandacss_encoder::AtomValue::Number` is stored as a string internally so
/// `Atom` can be `Hash + Eq`. At the JS boundary we parse back to an actual
/// number so consumers see `42`, not `"42"`. Integers and floats are
/// distinguished — same rule the literal evaluator uses (2^53 safe-integer
/// boundary).
pub(crate) fn to_atom_value(v: &pandacss_encoder::AtomValue) -> serde_json::Value {
    match v {
        pandacss_encoder::AtomValue::String(s) => serde_json::Value::String(s.to_string()),
        pandacss_encoder::AtomValue::Number(s) => parse_number_string(s),
        pandacss_encoder::AtomValue::Bool(b) => serde_json::Value::Bool(*b),
        pandacss_encoder::AtomValue::Null => serde_json::Value::Null,
    }
}

fn parse_number_string(s: &str) -> serde_json::Value {
    if let Ok(n) = s.parse::<i64>() {
        return serde_json::Value::from(n);
    }
    if let Ok(f) = s.parse::<f64>()
        && let Some(num) = serde_json::Number::from_f64(f)
    {
        return serde_json::Value::Number(num);
    }
    // Unparseable — preserve the raw string rather than drop.
    serde_json::Value::String(s.to_string())
}

/// Build a stable-ordered JS array of atoms. Sort by `(prop, conditions,
/// value)` so snapshot tests don't depend on hash-set iteration order.
pub(crate) fn to_atoms<S: std::hash::BuildHasher>(
    atoms: &std::collections::HashSet<pandacss_encoder::Atom, S>,
) -> Vec<crate::Atom> {
    let mut sorted: Vec<&pandacss_encoder::Atom> = atoms.iter().collect();
    sorted.sort_by(|a, b| {
        a.prop()
            .cmp(b.prop())
            .then_with(|| {
                let a_conds: Vec<&str> = a.conditions().iter().map(AsRef::as_ref).collect();
                let b_conds: Vec<&str> = b.conditions().iter().map(AsRef::as_ref).collect();
                a_conds.cmp(&b_conds)
            })
            .then_with(|| value_sort_key(a.value()).cmp(&value_sort_key(b.value())))
    });
    sorted
        .into_iter()
        .map(|atom| crate::Atom {
            prop: atom.prop().to_string(),
            value: to_atom_value(atom.value()),
            conditions: atom
                .conditions()
                .iter()
                .map(std::string::ToString::to_string)
                .collect::<Vec<String>>(),
        })
        .collect()
}

// Lexicographic sort key over the variant tag + raw bytes — stable, cheap.
fn value_sort_key(v: &pandacss_encoder::AtomValue) -> String {
    match v {
        pandacss_encoder::AtomValue::String(s) => format!("s:{s}"),
        pandacss_encoder::AtomValue::Number(s) => format!("n:{s}"),
        pandacss_encoder::AtomValue::Bool(b) => format!("b:{b}"),
        pandacss_encoder::AtomValue::Null => "z:".to_owned(),
    }
}
