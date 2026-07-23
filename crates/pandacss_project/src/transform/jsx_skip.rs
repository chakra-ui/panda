//! Skip heuristics for JSX dynamic className / style expressions (not collectors).

use pandacss_extractor::{ExpressionFacts, ExpressionKind};

/// Non-ternary logical style expressions (`&&` / `||`) are not finite conditionals.
#[must_use]
pub(super) fn dynamic_style_expression_should_skip(expression: &ExpressionFacts) -> bool {
    expression.kind == ExpressionKind::Logical
}

#[must_use]
pub(super) fn dynamic_class_name_expression_should_skip(expression: &ExpressionFacts) -> bool {
    if expression.kind == ExpressionKind::Template {
        return true;
    }
    if dynamic_style_expression_should_skip(expression) {
        return true;
    }
    expression.kind == ExpressionKind::Call
        && expression
            .call_name
            .as_deref()
            .is_some_and(|name| matches!(name, "clsx" | "cn" | "classNames" | "classnames"))
}

#[cfg(test)]
mod tests {
    use pandacss_extractor::{ExpressionFacts, ExpressionKind};

    fn facts(kind: ExpressionKind, call_name: Option<&str>) -> ExpressionFacts {
        ExpressionFacts {
            kind,
            call_name: call_name.map(str::to_owned),
            ..Default::default()
        }
    }

    #[test]
    fn skips_logical_and_without_ternary() {
        assert!(super::dynamic_style_expression_should_skip(&facts(
            ExpressionKind::Logical,
            None,
        )));
    }

    #[test]
    fn allows_parenthesized_condition_in_ternary() {
        assert!(!super::dynamic_style_expression_should_skip(&facts(
            ExpressionKind::Conditional,
            None,
        )));
    }

    #[test]
    fn skips_clsx_class_name_expression() {
        assert!(super::dynamic_class_name_expression_should_skip(&facts(
            ExpressionKind::Call,
            Some("clsx"),
        )));
    }

    #[test]
    fn allows_qwik_array_class_expression() {
        assert!(!super::dynamic_class_name_expression_should_skip(&facts(
            ExpressionKind::Array,
            None,
        )));
    }

    #[test]
    fn allows_qwik_record_class_expression() {
        assert!(!super::dynamic_class_name_expression_should_skip(&facts(
            ExpressionKind::Object,
            None,
        )));
    }

    #[test]
    fn allows_plain_identifier_class_expression() {
        assert!(!super::dynamic_class_name_expression_should_skip(&facts(
            ExpressionKind::Other,
            None,
        )));
    }
}
