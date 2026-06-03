use serde::Serialize;

pub mod codes {
    pub const COMPILE_PLACEHOLDER: &str = "compile_placeholder";
    pub const CONFIG_ARTIFACT_NAME_CONFLICT: &str = "config_artifact_name_conflict";
    pub const CONFIG_BREAKPOINT_UNITS_MIXED: &str = "config_breakpoint_units_mixed";
    pub const CONFIG_CONDITION_SELECTOR_INVALID: &str = "config_condition_selector_invalid";
    pub const CONFIG_TOKEN_CIRCULAR_REFERENCE: &str = "config_token_circular_reference";
    pub const CONFIG_TOKEN_KEY_CONTAINS_SPACE: &str = "config_token_key_contains_space";
    pub const CONFIG_TOKEN_MISSING_REFERENCE: &str = "config_token_missing_reference";
    pub const CONFIG_TOKEN_MISSING_VALUE: &str = "config_token_missing_value";
    pub const CONFIG_TOKEN_NESTED_VALUE: &str = "config_token_nested_value";
    pub const CONFIG_TOKEN_SELF_REFERENCE: &str = "config_token_self_reference";
    pub const CONFIG_TOKEN_UNKNOWN_REFERENCE: &str = "config_token_unknown_reference";
    pub const DEPRECATED_TOKEN_USED: &str = "deprecated_token_used";
    pub const DEPRECATED_UTILITY_USED: &str = "deprecated_utility_used";
    pub const JS_PARSE_ERROR: &str = "js_parse_error";
    pub const LAYER_NAME_COLLISION: &str = "layer_name_collision";
    pub const PREFLIGHT_OPTIONS_UNSUPPORTED: &str = "preflight_options_unsupported";
    pub const STATIC_CSS_PATTERN_MISSING_TRANSFORM: &str = "static_css_pattern_missing_transform";
    pub const STATIC_CSS_PATTERN_UNKNOWN: &str = "static_css_pattern_unknown";
    pub const STATIC_CSS_PROPERTY_UNKNOWN: &str = "static_css_property_unknown";
    pub const STATIC_CSS_RECIPE_UNKNOWN: &str = "static_css_recipe_unknown";
    pub const STATIC_CSS_RECIPE_VARIANT_UNKNOWN: &str = "static_css_recipe_variant_unknown";
    pub const STATIC_CSS_RECIPE_VARIANT_VALUE_UNKNOWN: &str =
        "static_css_recipe_variant_value_unknown";
    pub const STATIC_CSS_RECIPES_MISSING_SNAPSHOT: &str = "static_css_recipes_missing_snapshot";
    pub const STATIC_CSS_TOKEN_REFERENCE_UNKNOWN: &str = "static_css_token_reference_unknown";
    pub const STATIC_CSS_WILDCARD_LARGE: &str = "static_css_wildcard_large";
    pub const STATIC_CSS_WILDCARD_EMPTY: &str = "static_css_wildcard_empty";
    pub const PANDA_CALL_UNEXTRACTABLE: &str = "panda_call_unextractable";
    pub const TOKEN_DICTIONARY_BUILD_FAILED: &str = "token_dictionary_build_failed";
    pub const TRANSFORM_CALLBACK_FAILED: &str = "transform_callback_failed";
}

/// UTF-8 byte offsets.
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

/// 1-indexed line, 1-indexed UTF-16 column.
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocation {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SourceRange {
    pub start: SourceLocation,
    pub end: SourceLocation,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticSeverity {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub code: String,
    pub message: String,
    pub severity: DiagnosticSeverity,
    /// UTF-8 byte offsets. Useful for slicing the source. `None` when the
    /// underlying error didn't attribute a location.
    pub span: Option<Span>,
    /// Human-readable line/column range covering the same offsets as `span`.
    /// 1-indexed line, 1-indexed UTF-16 column — matches `tsc`/IDE output.
    pub location: Option<SourceRange>,
}

impl Diagnostic {
    #[must_use]
    pub fn new(
        severity: DiagnosticSeverity,
        code: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            severity,
            span: None,
            location: None,
        }
    }

    #[must_use]
    pub fn info(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(DiagnosticSeverity::Info, code, message)
    }

    #[must_use]
    pub fn warning(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(DiagnosticSeverity::Warning, code, message)
    }

    #[must_use]
    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(DiagnosticSeverity::Error, code, message)
    }

    #[must_use]
    pub fn with_span(mut self, span: Span) -> Self {
        self.span = Some(span);
        self
    }

    #[must_use]
    pub fn with_location(mut self, location: SourceRange) -> Self {
        self.location = Some(location);
        self
    }
}
