//! Skip heuristics for JSX dynamic className / style expressions (not collectors).

/// Non-ternary logical style expressions (`&&` / `||`) are not finite conditionals.
#[must_use]
pub(super) fn dynamic_style_expression_should_skip(expression: &str) -> bool {
    let expression = expression.trim();
    if pandacss_extractor::parse_ternary_fragment(expression).is_some() {
        return false;
    }
    pandacss_extractor::is_logical_expression(expression)
}

#[must_use]
pub(super) fn dynamic_class_name_expression_should_skip(expression: &str) -> bool {
    let expression = expression.trim();
    if expression.contains('`') && expression.contains("${") {
        return true;
    }
    if super::helper::is_array_or_object_class_literal(expression) {
        return false;
    }
    if dynamic_style_expression_should_skip(expression) {
        return true;
    }
    ["clsx(", "cn(", "classNames(", "classnames("]
        .iter()
        .any(|needle| expression.contains(needle))
}

#[cfg(test)]
mod tests {
    #[test]
    fn skips_logical_and_without_ternary() {
        assert!(super::dynamic_style_expression_should_skip(
            "isError && 'red'"
        ));
    }

    #[test]
    fn allows_parenthesized_condition_in_ternary() {
        assert!(!super::dynamic_style_expression_should_skip(
            "(isReady && isError) ? 'red' : 'blue'"
        ));
    }

    #[test]
    fn skips_clsx_class_name_expression() {
        assert!(super::dynamic_class_name_expression_should_skip(
            "clsx('a', cond && 'b')"
        ));
    }

    #[test]
    fn allows_qwik_array_class_expression() {
        assert!(!super::dynamic_class_name_expression_should_skip(
            "[styles.container, 'p-8', props.isHighAttention ? 'text-green-500' : 'text-slate-500', { active: true }]"
        ));
    }

    #[test]
    fn allows_qwik_record_class_expression() {
        assert!(!super::dynamic_class_name_expression_should_skip(
            "{ 'text-green-500': props.isHighAttention, 'p-4': true }"
        ));
    }

    #[test]
    fn allows_plain_identifier_class_expression() {
        assert!(!super::dynamic_class_name_expression_should_skip(
            "styles.container"
        ));
    }
}
