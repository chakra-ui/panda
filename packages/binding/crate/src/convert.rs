//! Shared conversion helpers between `extractor::` types and the NAPI
//! mirror types defined in sibling modules. Keep all `extractor::X -> X`
//! mapping here so the NAPI entrypoints stay readable.

use crate::{
    Diagnostic, DiagnosticSeverity, ExtractedCall, ExtractedJsx, ImportKind, ImportRecord,
    ImportSpecifier, ImportSpecifierKind, MatchCategory, MatchedImport, Matcher, Matchers, Span,
};

pub(crate) fn convert_span(span: extractor::Span) -> Span {
    Span {
        start: span.start,
        end: span.end,
    }
}

pub(crate) fn convert_severity(s: extractor::DiagnosticSeverity) -> DiagnosticSeverity {
    match s {
        extractor::DiagnosticSeverity::Error => DiagnosticSeverity::Error,
        extractor::DiagnosticSeverity::Warning => DiagnosticSeverity::Warning,
    }
}

pub(crate) fn convert_diagnostic(d: extractor::Diagnostic) -> Diagnostic {
    Diagnostic {
        message: d.message,
        severity: convert_severity(d.severity),
        span: d.span.map(convert_span),
        location: d.location.map(convert_range),
    }
}

fn convert_location(loc: extractor::SourceLocation) -> crate::SourceLocation {
    crate::SourceLocation {
        line: loc.line,
        column: loc.column,
    }
}

fn convert_range(range: extractor::SourceRange) -> crate::SourceRange {
    crate::SourceRange {
        start: convert_location(range.start),
        end: convert_location(range.end),
    }
}

pub(crate) fn convert_kind(k: extractor::ImportKind) -> ImportKind {
    match k {
        extractor::ImportKind::SideEffect => ImportKind::SideEffect,
        extractor::ImportKind::Value => ImportKind::Value,
    }
}

pub(crate) fn convert_specifier_kind(k: extractor::ImportSpecifierKind) -> ImportSpecifierKind {
    match k {
        extractor::ImportSpecifierKind::Named => ImportSpecifierKind::Named,
        extractor::ImportSpecifierKind::Default => ImportSpecifierKind::Default,
        extractor::ImportSpecifierKind::Namespace => ImportSpecifierKind::Namespace,
    }
}

pub(crate) fn convert_specifier(specifier: extractor::ImportSpecifier) -> ImportSpecifier {
    ImportSpecifier {
        kind: convert_specifier_kind(specifier.kind),
        imported: specifier.imported,
        local: specifier.local,
        type_only: specifier.type_only,
        span: convert_span(specifier.span),
    }
}

pub(crate) fn convert_record(record: extractor::ImportRecord) -> ImportRecord {
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

pub(crate) fn convert_category(c: extractor::MatchCategory) -> MatchCategory {
    match c {
        extractor::MatchCategory::Css => MatchCategory::Css,
        extractor::MatchCategory::Recipe => MatchCategory::Recipe,
        extractor::MatchCategory::Pattern => MatchCategory::Pattern,
        extractor::MatchCategory::Jsx => MatchCategory::Jsx,
        extractor::MatchCategory::Tokens => MatchCategory::Tokens,
    }
}

pub(crate) fn to_matched(m: MatchedImport) -> extractor::MatchedImport {
    extractor::MatchedImport {
        category: match m.category {
            MatchCategory::Css => extractor::MatchCategory::Css,
            MatchCategory::Recipe => extractor::MatchCategory::Recipe,
            MatchCategory::Pattern => extractor::MatchCategory::Pattern,
            MatchCategory::Jsx => extractor::MatchCategory::Jsx,
            MatchCategory::Tokens => extractor::MatchCategory::Tokens,
        },
        module: m.module,
        name: m.name,
        alias: m.alias,
        kind: match m.kind {
            ImportSpecifierKind::Named => extractor::ImportSpecifierKind::Named,
            ImportSpecifierKind::Default => extractor::ImportSpecifierKind::Default,
            ImportSpecifierKind::Namespace => extractor::ImportSpecifierKind::Namespace,
        },
    }
}

pub(crate) fn matched_record(m: extractor::MatchedImport) -> MatchedImport {
    MatchedImport {
        category: convert_category(m.category),
        module: m.module,
        name: m.name,
        alias: m.alias,
        kind: convert_specifier_kind(m.kind),
    }
}

pub(crate) fn to_core_matcher(m: Matcher) -> extractor::Matcher {
    extractor::Matcher {
        modules: m.modules,
        names: match m.names {
            None => extractor::NameMatcher::Any,
            Some(list) => extractor::NameMatcher::only(list),
        },
    }
}

/// Convert a JS-shaped `Matchers` (which historically carried the token
/// dictionary as a child field) into a core `ExtractorConfig`. Keeping
/// the wire shape flat avoids a churn cycle on JS callers — the split is
/// purely Rust-internal.
pub(crate) fn to_core_config(m: Matchers) -> extractor::ExtractorConfig {
    let token_dictionary = m.token_dictionary.clone().map(to_core_token_dictionary);
    extractor::ExtractorConfig {
        matchers: to_core_matchers(m),
        token_dictionary,
    }
}

pub(crate) fn to_core_matchers(m: Matchers) -> extractor::Matchers {
    extractor::Matchers {
        css: to_core_matcher(m.css),
        recipe: to_core_matcher(m.recipe),
        pattern: to_core_matcher(m.pattern),
        jsx: m.jsx.map(to_core_matcher),
        tokens: to_core_matcher(m.tokens),
    }
}

fn to_core_token_dictionary(d: crate::TokenDictionary) -> tokens::TokenDictionary {
    // The JS side passes two parallel `path → string` maps. Re-key them
    // into the structured `Token` records the `tokens` crate uses.
    tokens::TokenDictionary::builder()
        .extend_flat(d.values, &d.vars)
        .build()
}

pub(crate) fn to_call(c: extractor::ExtractedCall) -> ExtractedCall {
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

pub(crate) fn to_jsx(j: extractor::ExtractedJsx) -> ExtractedJsx {
    ExtractedJsx {
        category: convert_category(j.category),
        name: j.name,
        alias: j.alias,
        data: j.data.to_json(),
        span: convert_span(j.span),
    }
}
