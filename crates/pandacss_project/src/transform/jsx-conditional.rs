//! Finite conditional style literals → runtime className expressions.

use pandacss_extractor::{ExtractedJsx, Literal};

use crate::PatternTransformFn;
use crate::Project;

use super::jsx_parse::{
    ParsedAttribute, ParsedObjectLiteral, ParsedOpeningElement, parse_object_literal,
};
use super::jsx_parse::{ParsedTernary, parse_top_level_ternary};

/// Max conditional style props per JSX element (linear join output, not cross-product).
pub(super) const MAX_CONDITIONAL_SITES: usize = 64;

#[derive(Debug, Clone)]
struct ConditionalSite {
    path: Vec<String>,
    branches: Vec<Literal>,
    ternary: ParsedTernary,
}

pub(super) fn jsx_data_within_branch_budget(data: &Literal) -> bool {
    let Some(entries) = literal_object_entries(data) else {
        return true;
    };
    count_finite_conditionals(entries) <= MAX_CONDITIONAL_SITES
}

pub(super) fn jsx_data_has_finite_conditional(data: &Literal) -> bool {
    let Some(entries) = literal_object_entries(data) else {
        return false;
    };
    entries
        .iter()
        .any(|(_, value)| contains_finite_conditional(value))
}

pub(super) fn class_expression_for_jsx_data(
    project: &Project,
    jsx: &ExtractedJsx,
    parsed: &ParsedOpeningElement,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let entries = literal_object_entries(&jsx.data)?;
    let sites = collect_conditional_sites(entries, parsed);
    if sites.is_empty() || sites.len() > MAX_CONDITIONAL_SITES {
        return None;
    }

    if sites.len() == 1 {
        return single_site_expression(
            project,
            jsx,
            entries,
            &sites[0],
            pattern_transform.as_deref_mut(),
        );
    }

    let mut parts = Vec::with_capacity(sites.len());
    for site in &sites {
        parts.push(single_site_expression(
            project,
            jsx,
            entries,
            site,
            pattern_transform.as_deref_mut(),
        )?);
    }
    Some(
        parts
            .into_iter()
            .map(|part| format!("({part})"))
            .collect::<Vec<_>>()
            .join(" + \" \" + "),
    )
}

pub(super) fn class_expression_for_runtime_props(
    project: &Project,
    jsx: &ExtractedJsx,
    props: &str,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let parsed = parse_object_literal(props)?;
    let attrs: Vec<ParsedAttribute> = parsed
        .properties
        .iter()
        .filter_map(|prop| {
            let key = prop.key.as_ref()?;
            Some(ParsedAttribute {
                name: Some(key.clone()),
                raw: prop.raw.clone(),
                spread: prop.is_spread(),
                dynamic: prop.value_is_dynamic(),
            })
        })
        .collect();
    let opening = ParsedOpeningElement {
        attributes: attrs,
        self_closing: false,
    };
    class_expression_for_jsx_data(project, jsx, &opening, pattern_transform)
}

fn single_site_expression(
    project: &Project,
    jsx: &ExtractedJsx,
    entries: &[(String, Literal)],
    site: &ConditionalSite,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let mut branch_classes = Vec::new();
    for branch in &site.branches {
        let mut next = static_entries(entries);
        apply_branch(&mut next, &site.path, branch.clone());
        let classes = class_names_for_branch_literal(
            project,
            jsx,
            &Literal::Object(next),
            pattern_transform.as_deref_mut(),
        )?;
        branch_classes.push(classes);
    }
    if branch_classes.len() != 2 {
        return None;
    }
    Some(format!(
        "{} ? \"{}\" : \"{}\"",
        site.ternary.condition, branch_classes[0], branch_classes[1]
    ))
}

fn class_names_for_branch_literal(
    project: &Project,
    jsx: &ExtractedJsx,
    branch_object: &Literal,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> Option<String> {
    let branch_jsx = ExtractedJsx {
        data: branch_object.clone(),
        ..jsx.clone()
    };
    Some(
        project
            .class_names_for_jsx_usage(&branch_jsx, pattern_transform)?
            .join(" "),
    )
}

fn collect_conditional_sites(
    entries: &[(String, Literal)],
    parsed: &ParsedOpeningElement,
) -> Vec<ConditionalSite> {
    let mut sites = Vec::new();
    for (key, value) in entries {
        let mut path = vec![key.clone()];
        walk_conditional_sites(value, &mut path, parsed, &mut sites);
    }
    sites
}

fn walk_conditional_sites(
    value: &Literal,
    path: &mut Vec<String>,
    parsed: &ParsedOpeningElement,
    sites: &mut Vec<ConditionalSite>,
) {
    match value {
        Literal::Conditional(branches) => {
            let Some(expr) = expression_for_path(parsed, path) else {
                return;
            };
            let Some(ternary) = parse_top_level_ternary(&expr) else {
                return;
            };
            sites.push(ConditionalSite {
                path: path.clone(),
                branches: branches.clone(),
                ternary,
            });
        }
        Literal::Object(inner) => {
            for (key, nested) in inner {
                path.push(key.clone());
                walk_conditional_sites(nested, path, parsed, sites);
                path.pop();
            }
        }
        _ => {}
    }
}

fn expression_for_path(parsed: &ParsedOpeningElement, path: &[String]) -> Option<String> {
    let (head, tail) = path.split_first()?;
    let attr = parsed
        .attributes
        .iter()
        .find(|attr| attr.name.as_deref() == Some(head.as_str()))?;
    if tail.is_empty() {
        return attr.expression_source();
    }
    let expr = attr.expression_source()?;
    expression_for_object_path(&parse_object_expression(&expr)?, tail)
}

fn expression_for_object_path(obj: &ParsedObjectLiteral, path: &[String]) -> Option<String> {
    let (head, tail) = path.split_first()?;
    let prop = obj
        .properties
        .iter()
        .find(|prop| prop.key.as_deref() == Some(head.as_str()))?;
    if tail.is_empty() {
        return prop.expression_source();
    }
    let expr = prop.expression_source()?;
    expression_for_object_path(&parse_object_expression(&expr)?, tail)
}

fn parse_object_expression(expr: &str) -> Option<ParsedObjectLiteral> {
    let trimmed = expr.trim();
    if trimmed.starts_with('{') {
        parse_object_literal(trimmed)
    } else {
        parse_object_literal(&format!("{{{trimmed}}}"))
    }
}

fn static_entries(entries: &[(String, Literal)]) -> Vec<(String, Literal)> {
    entries
        .iter()
        .filter_map(|(key, value)| {
            if contains_finite_conditional(value) {
                None
            } else {
                Some((key.clone(), value.clone()))
            }
        })
        .collect()
}

fn apply_branch(entries: &mut Vec<(String, Literal)>, path: &[String], branch: Literal) {
    let Some((head, tail)) = path.split_first() else {
        return;
    };
    if tail.is_empty() {
        entries.push((head.clone(), branch));
        return;
    }
    entries.push((head.clone(), Literal::Object(nested_object(tail, branch))));
}

fn nested_object(path: &[String], branch: Literal) -> Vec<(String, Literal)> {
    let Some((head, tail)) = path.split_first() else {
        return Vec::new();
    };
    if tail.is_empty() {
        vec![(head.clone(), branch)]
    } else {
        vec![(head.clone(), Literal::Object(nested_object(tail, branch)))]
    }
}

fn count_finite_conditionals(entries: &[(String, Literal)]) -> usize {
    entries
        .iter()
        .map(|(_, value)| count_finite_conditionals_in_value(value))
        .sum()
}

fn count_finite_conditionals_in_value(value: &Literal) -> usize {
    match value {
        Literal::Conditional(_) => 1,
        Literal::Object(inner) => inner
            .iter()
            .map(|(_, nested)| count_finite_conditionals_in_value(nested))
            .sum(),
        _ => 0,
    }
}

fn contains_finite_conditional(value: &Literal) -> bool {
    count_finite_conditionals_in_value(value) > 0
}

fn literal_object_entries(value: &Literal) -> Option<&[(String, Literal)]> {
    match value {
        Literal::Object(entries) => Some(entries),
        _ => None,
    }
}

/// Non-ternary logical style expressions (`&&` / `||`) are not finite conditionals.
pub(super) fn dynamic_style_expression_should_skip(expression: &str) -> bool {
    let expression = expression.trim();
    if parse_top_level_ternary(expression).is_some() {
        return false;
    }
    pandacss_extractor::is_logical_expression(expression)
}

pub(super) fn dynamic_class_name_expression_should_skip(expression: &str) -> bool {
    let expression = expression.trim();
    if expression.contains('`') && expression.contains("${") {
        return true;
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
    use pandacss_extractor::Literal;

    use super::super::jsx_parse::parse_top_level_ternary;
    use super::{
        MAX_CONDITIONAL_SITES, count_finite_conditionals, count_finite_conditionals_in_value,
        jsx_data_within_branch_budget,
    };

    #[test]
    fn parses_simple_ternary() {
        let parsed = parse_top_level_ternary("isError ? 'red' : 'blue'").expect("ternary");
        assert_eq!(parsed.condition, "isError");
        assert_eq!(parsed.consequent, "'red'");
        assert_eq!(parsed.alternate, "'blue'");
    }

    #[test]
    fn parses_ternary_with_parenthesized_condition() {
        let parsed =
            parse_top_level_ternary("(isReady && isError) ? 'red' : 'blue'").expect("ternary");
        assert_eq!(parsed.condition, "(isReady && isError)");
    }

    #[test]
    fn parses_ternary_inside_nested_call_parens() {
        let parsed = parse_top_level_ternary("flag ? fn('a?b') : fn('c:d')").expect("ternary");
        assert_eq!(parsed.condition, "flag");
        assert_eq!(parsed.consequent, "fn('a?b')");
        assert_eq!(parsed.alternate, "fn('c:d')");
    }

    #[test]
    fn rejects_non_ternary_expressions() {
        assert!(parse_top_level_ternary("props.color").is_none());
        assert!(parse_top_level_ternary("? 'a' : 'b'").is_none());
        assert!(parse_top_level_ternary("'a' ? : 'b'").is_none());
    }

    #[test]
    fn counts_independent_conditionals_by_site_not_branch_product() {
        let entries = [
            ("color".into(), Literal::Conditional(vec![])),
            ("padding".into(), Literal::Conditional(vec![])),
            ("margin".into(), Literal::Conditional(vec![])),
            ("opacity".into(), Literal::Conditional(vec![])),
        ];
        assert_eq!(count_finite_conditionals(&entries), 4);
    }

    #[test]
    fn counts_deeply_nested_conditionals() {
        let value = Literal::Object(vec![(
            "_hover".into(),
            Literal::Object(vec![(
                "_dark".into(),
                Literal::Object(vec![("color".into(), Literal::Conditional(vec![]))]),
            )]),
        )]);
        assert_eq!(count_finite_conditionals_in_value(&value), 1);
    }

    #[test]
    fn budget_allows_up_to_max_conditional_sites() {
        let entries: Vec<_> = (0..MAX_CONDITIONAL_SITES)
            .map(|index| (format!("prop{index}"), Literal::Conditional(vec![])))
            .collect();
        assert!(jsx_data_within_branch_budget(&Literal::Object(entries)));
    }

    #[test]
    fn budget_rejects_over_max_conditional_sites() {
        let entries: Vec<_> = (0..=MAX_CONDITIONAL_SITES)
            .map(|index| (format!("prop{index}"), Literal::Conditional(vec![])))
            .collect();
        assert!(!jsx_data_within_branch_budget(&Literal::Object(entries)));
    }

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
}
