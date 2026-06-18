use serde::Serialize;

pub mod codes {
    pub const COMPILE_PLACEHOLDER: &str = "compile_placeholder";
    pub const CONFIG_ARTIFACT_NAME_CONFLICT: &str = "config_artifact_name_conflict";
    pub const CONFIG_BREAKPOINT_UNITS_MIXED: &str = "config_breakpoint_units_mixed";
    pub const CONFIG_CONTAINER_CONDITION_CONFLICT: &str = "config_container_condition_conflict";
    pub const CONFIG_CONTAINER_INVALID: &str = "config_container_invalid";
    pub const CONFIG_CONTAINER_NAME_INVALID: &str = "config_container_name_invalid";
    pub const CONFIG_CONTAINER_UNITS_MIXED: &str = "config_container_units_mixed";
    pub const CONFIG_CONDITION_ARRAY_UNSUPPORTED: &str = "config_condition_array_unsupported";
    pub const CONFIG_CONDITION_SELECTOR_INVALID: &str = "config_condition_selector_invalid";
    pub const CONFIG_UTILITY_VALUES_INVALID: &str = "config_utility_values_invalid";
    pub const CONFIG_TOKEN_CIRCULAR_REFERENCE: &str = "config_token_circular_reference";
    pub const CONFIG_TOKEN_KEY_CONTAINS_SPACE: &str = "config_token_key_contains_space";
    pub const CONFIG_TOKEN_MISSING_REFERENCE: &str = "config_token_missing_reference";
    pub const CONFIG_TOKEN_MISSING_VALUE: &str = "config_token_missing_value";
    pub const CONFIG_TOKEN_NESTED_VALUE: &str = "config_token_nested_value";
    pub const CONFIG_TOKEN_SELF_REFERENCE: &str = "config_token_self_reference";
    pub const CONFIG_TOKEN_UNKNOWN_REFERENCE: &str = "config_token_unknown_reference";
    pub const DEPRECATED_TOKEN_USED: &str = "deprecated_token_used";
    pub const DEPRECATED_UTILITY_USED: &str = "deprecated_utility_used";
    pub const INVALID_COLOR_OPACITY_MODIFIER: &str = "invalid_color_opacity_modifier";
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
    pub const UNKNOWN_CONDITION: &str = "unknown_condition";
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

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticLabel {
    pub message: Option<String>,
    /// UTF-8 byte offsets.
    pub span: Option<Span>,
    /// 1-indexed line, 1-indexed UTF-16 column.
    pub location: Option<SourceRange>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    /// UTF-8 byte offsets. Useful for slicing the source. `None` when the
    /// underlying error didn't attribute a location.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span: Option<Span>,
    /// Human-readable line/column range covering the same offsets as `span`.
    /// 1-indexed line, 1-indexed UTF-16 column — matches `tsc`/IDE output.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<SourceRange>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub labels: Option<Vec<DiagnosticLabel>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help: Option<Vec<String>>,
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
            file: None,
            category: None,
            span: None,
            location: None,
            labels: None,
            help: None,
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

    #[must_use]
    pub fn with_file(mut self, file: impl Into<String>) -> Self {
        self.file = Some(file.into());
        self
    }

    #[must_use]
    pub fn with_category(mut self, category: impl Into<String>) -> Self {
        self.category = Some(category.into());
        self
    }

    #[must_use]
    pub fn with_label(mut self, label: DiagnosticLabel) -> Self {
        self.labels.get_or_insert_with(Vec::new).push(label);
        self
    }

    #[must_use]
    pub fn with_help(mut self, help: impl Into<String>) -> Self {
        self.help.get_or_insert_with(Vec::new).push(help.into());
        self
    }
}
