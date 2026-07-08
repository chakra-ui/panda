//! Finite conditional `css(...)` args → runtime class string expressions.
//!
//! Conditionals are discovered from **source** (property values, nested objects,
//! spreads, whole-arg ternaries) so depth and spread shape do not matter. Each
//! site becomes `cond ? "branchA" : "branchB"`; independent sites join with ` + " " + `.

use std::collections::HashSet;

use crate::Project;
use pandacss_extractor::Literal;
use pandacss_shared::Span;

use super::jsx_parse::{ParsedObjectLiteral, parse_object_literal, parse_static_string};
use super::jsx_parse::{ParsedTernary, parse_top_level_ternary};
use super::resolve::{call_arg_span, classes_for_css_args};

const MAX_CONDITIONAL_SITES: usize = 64;

#[derive(Debug)]
enum ConditionalSite {
    Property {
        path: Vec<String>,
        ternary: ParsedTernary,
    },
    Spread {
        condition: String,
        branch_objects: [ParsedObjectLiteral; 2],
        affected_keys: HashSet<String>,
    },
}

pub(crate) fn args_have_finite_conditional(args: &[Option<Literal>]) -> bool {
    args.iter().flatten().any(contains_finite_conditional)
}

pub(crate) fn args_need_conditional_rewrite(
    source: &str,
    call_span: Span,
    args: &[Option<Literal>],
) -> bool {
    let Some(arg) = args.first().and_then(|value| value.as_ref()) else {
        return false;
    };
    if matches!(
        arg,
        Literal::Conditional(branches) if branches.iter().all(is_object_branch)
    ) {
        return true;
    }
    let Some(arg_source) = css_call_arg_source(source, call_span) else {
        return args_have_finite_conditional(args);
    };
    let Literal::Object(entries) = arg else {
        return false;
    };
    let Some(parsed) = parse_object_literal(arg_source) else {
        return args_have_finite_conditional(args);
    };
    !collect_conditional_sites(&parsed, entries).is_empty()
}

pub(crate) fn class_expression_for_css_call(
    project: &Project,
    source: &str,
    call_span: Span,
    args: &[Option<Literal>],
) -> Option<String> {
    let arg = args.first().and_then(|value| value.as_ref())?;
    let arg_source = css_call_arg_source(source, call_span)?;

    if let Literal::Conditional(branches) = arg
        && branches.iter().all(is_object_branch)
    {
        return whole_arg_expression(project, arg_source, branches);
    }

    let Literal::Object(entries) = arg else {
        return None;
    };
    let parsed = parse_object_literal(arg_source)?;
    let sites = collect_conditional_sites(&parsed, entries);
    if sites.is_empty() || sites.len() > MAX_CONDITIONAL_SITES {
        return None;
    }

    if sites.len() == 1 {
        return single_site_expression(project, entries, &sites[0]);
    }

    let parts: Option<Vec<String>> = sites
        .iter()
        .map(|site| single_site_expression(project, entries, site))
        .collect();
    let parts = parts?;
    Some(
        parts
            .into_iter()
            .map(|part| format!("({part})"))
            .collect::<Vec<_>>()
            .join(" + \" \" + "),
    )
}

fn css_call_arg_source(source: &str, call_span: Span) -> Option<&str> {
    let (arg_start, arg_end) = call_arg_span(source, call_span, 0)?;
    let start = usize::try_from(arg_start).ok()?;
    let end = usize::try_from(arg_end).ok()?;
    source.get(start..end)
}

fn whole_arg_expression(
    project: &Project,
    arg_source: &str,
    branches: &[Literal],
) -> Option<String> {
    let ternary = parse_top_level_ternary(arg_source)?;
    let mut branch_classes = Vec::new();
    for branch in branches {
        let classes = classes_for_css_args(project, &[Some(branch.clone())])?;
        branch_classes.push(classes.join(" "));
    }
    if branch_classes.len() != 2 {
        return None;
    }
    Some(format!(
        "{} ? \"{}\" : \"{}\"",
        ternary.condition, branch_classes[0], branch_classes[1]
    ))
}

fn single_site_expression(
    project: &Project,
    entries: &[(String, Literal)],
    site: &ConditionalSite,
) -> Option<String> {
    let mut branch_classes = Vec::new();
    match site {
        ConditionalSite::Property { path, ternary } => {
            let branches = branch_literals_for_property_site(entries, path, ternary)?;
            for branch in branches {
                let mut next = static_entries(entries);
                apply_branch(&mut next, path, branch);
                let classes = classes_for_css_args(project, &[Some(Literal::Object(next))])?;
                branch_classes.push(classes.join(" "));
            }
            if branch_classes.len() != 2 {
                return None;
            }
            Some(format!(
                "{} ? \"{}\" : \"{}\"",
                ternary.condition, branch_classes[0], branch_classes[1]
            ))
        }
        ConditionalSite::Spread {
            condition,
            branch_objects,
            affected_keys,
        } => {
            for branch_object in branch_objects {
                let mut next = entries_without_keys(entries, affected_keys);
                merge_static_object(&mut next, branch_object);
                let classes = classes_for_css_args(project, &[Some(Literal::Object(next))])?;
                branch_classes.push(classes.join(" "));
            }
            if branch_classes.len() != 2 {
                return None;
            }
            Some(format!(
                "{} ? \"{}\" : \"{}\"",
                condition, branch_classes[0], branch_classes[1]
            ))
        }
    }
}

fn collect_conditional_sites(
    parsed: &ParsedObjectLiteral,
    entries: &[(String, Literal)],
) -> Vec<ConditionalSite> {
    let mut path = Vec::new();
    let mut sites = Vec::new();
    collect_conditional_sites_from_parsed(parsed, entries, entries, &mut path, &mut sites);
    sites
}

fn collect_conditional_sites_from_parsed(
    parsed: &ParsedObjectLiteral,
    entries: &[(String, Literal)],
    root_entries: &[(String, Literal)],
    path: &mut Vec<String>,
    sites: &mut Vec<ConditionalSite>,
) {
    for prop in &parsed.properties {
        if prop.spread {
            let Some(expr) = prop.spread_expression() else {
                continue;
            };
            let Some(ternary) = parse_top_level_ternary(&expr) else {
                continue;
            };
            let Some(consequent) = parse_branch_object_literal(&ternary.consequent) else {
                continue;
            };
            let Some(alternate) = parse_branch_object_literal(&ternary.alternate) else {
                continue;
            };
            let mut affected_keys = HashSet::new();
            for object in [&consequent, &alternate] {
                for branch_prop in &object.properties {
                    if let Some(key) = &branch_prop.key {
                        affected_keys.insert(key.clone());
                    }
                }
            }
            sites.push(ConditionalSite::Spread {
                condition: ternary.condition,
                branch_objects: [consequent, alternate],
                affected_keys,
            });
            continue;
        }

        let Some(key) = prop.key.as_ref() else {
            continue;
        };
        let Some(expr) = css_property_expression(prop) else {
            continue;
        };

        if !expr.trim().starts_with('{')
            && let Some(ternary) = parse_top_level_ternary(&expr)
        {
            path.push(key.clone());
            if literal_is_conditional_at_path(root_entries, path) {
                sites.push(ConditionalSite::Property {
                    path: path.clone(),
                    ternary,
                });
            }
            path.pop();
            continue;
        }

        if let Some(nested_parsed) = parse_object_expression(&expr) {
            path.push(key.clone());
            let nested_entries = literal_object_entries_at_key(entries, key);
            collect_conditional_sites_from_parsed(
                &nested_parsed,
                nested_entries,
                root_entries,
                path,
                sites,
            );
            path.pop();
        }
    }
}

fn branch_literals_for_property_site(
    entries: &[(String, Literal)],
    path: &[String],
    ternary: &ParsedTernary,
) -> Option<Vec<Literal>> {
    if let Some(Literal::Conditional(branches)) = literal_at_path(entries, path)
        && branches.len() == 2
    {
        return Some(branches.clone());
    }
    Some(vec![
        literal_from_expression(&ternary.consequent)?,
        literal_from_expression(&ternary.alternate)?,
    ])
}

fn literal_at_path<'a>(entries: &'a [(String, Literal)], path: &[String]) -> Option<&'a Literal> {
    let (head, tail) = path.split_first()?;
    let value = entries
        .iter()
        .find(|(key, _)| key == head)
        .map(|(_, value)| value)?;
    if tail.is_empty() {
        return Some(value);
    }
    let Literal::Object(nested) = value else {
        return None;
    };
    literal_at_path(nested, tail)
}

fn literal_is_conditional_at_path(entries: &[(String, Literal)], path: &[String]) -> bool {
    matches!(
        literal_at_path(entries, path),
        Some(Literal::Conditional(_))
    )
}

fn literal_object_entries_at_key<'a>(
    entries: &'a [(String, Literal)],
    key: &str,
) -> &'a [(String, Literal)] {
    entries
        .iter()
        .find(|(entry_key, _)| entry_key == key)
        .and_then(|(_, value)| match value {
            Literal::Object(nested) => Some(nested.as_slice()),
            _ => None,
        })
        .unwrap_or(&[])
}

fn parse_branch_object_literal(expression: &str) -> Option<ParsedObjectLiteral> {
    let trimmed = expression.trim();
    if trimmed.starts_with('{') {
        parse_object_literal(trimmed)
    } else {
        None
    }
}

fn parse_object_expression(expr: &str) -> Option<ParsedObjectLiteral> {
    let trimmed = expr.trim();
    if trimmed.starts_with('{') {
        parse_object_literal(trimmed)
    } else {
        None
    }
}

fn css_property_expression(prop: &super::jsx_parse::ParsedProperty) -> Option<String> {
    if prop.spread {
        return prop.spread_expression();
    }
    let value = prop.raw.split_once(':')?.1.trim();
    (!value.is_empty()).then(|| value.to_owned())
}

fn literal_from_expression(expression: &str) -> Option<Literal> {
    let trimmed = expression.trim();
    if trimmed.starts_with('{') {
        let parsed = parse_object_literal(trimmed)?;
        return Some(literal_from_parsed_static_object(&parsed));
    }
    if let Some(value) = parse_static_string(trimmed) {
        return Some(Literal::String(value));
    }
    if trimmed == "true" {
        return Some(Literal::Bool(true));
    }
    if trimmed == "false" {
        return Some(Literal::Bool(false));
    }
    if trimmed == "null" {
        return Some(Literal::Null);
    }
    trimmed.parse::<f64>().ok().map(Literal::Number)
}

fn literal_from_parsed_static_object(parsed: &ParsedObjectLiteral) -> Literal {
    let entries = parsed
        .properties
        .iter()
        .filter_map(|prop| {
            if prop.spread {
                return None;
            }
            let key = prop.key.as_ref()?.clone();
            if let Some(nested) = parse_object_expression(css_property_expression(prop)?.as_str()) {
                return Some((key, literal_from_parsed_static_object(&nested)));
            }
            let expr = css_property_expression(prop)?;
            let value = literal_from_expression(&expr)?;
            Some((key, value))
        })
        .collect();
    Literal::Object(entries)
}

fn merge_static_object(entries: &mut Vec<(String, Literal)>, parsed: &ParsedObjectLiteral) {
    let object = literal_from_parsed_static_object(parsed);
    let Literal::Object(object_entries) = object else {
        return;
    };
    for (key, value) in object_entries {
        Literal::upsert_object_entry(entries, key, value);
    }
}

fn entries_without_keys(
    entries: &[(String, Literal)],
    keys: &HashSet<String>,
) -> Vec<(String, Literal)> {
    entries
        .iter()
        .filter(|(key, _)| !keys.contains(key))
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect()
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
        Literal::upsert_object_entry(entries, head.clone(), branch);
        return;
    }
    Literal::upsert_object_entry(
        entries,
        head.clone(),
        Literal::Object(nested_object(tail, branch)),
    );
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

fn contains_finite_conditional(value: &Literal) -> bool {
    match value {
        Literal::Conditional(_) => true,
        Literal::Object(entries) => entries
            .iter()
            .any(|(_, nested)| contains_finite_conditional(nested)),
        Literal::Array(items) => items.iter().any(contains_finite_conditional),
        _ => false,
    }
}

fn is_object_branch(branch: &Literal) -> bool {
    matches!(branch, Literal::Object(_))
}

#[cfg(test)]
mod tests {
    use crate::{Project, System};
    use pandacss_config::UserConfig;
    use pandacss_extractor::extract;
    use serde_json::json;

    use super::*;

    fn test_project() -> Project {
        let config: UserConfig = serde_json::from_value(json!({
            "outdir": "styled-system",
            "importMap": { "css": ["@panda/css"] },
            "conditions": { "hover": "&:hover" },
            "utilities": { "color": {} }
        }))
        .expect("config");
        let system = System::new(config).expect("system");
        Project::new(system)
    }

    #[test]
    fn builds_nested_hover_conditional_expression() {
        let project = test_project();
        let source = "import { css } from '@panda/css';\nexport const cls = css({ _hover: { color: unk ? 'red' : 'blue' } });";
        let extracted = extract(
            source,
            "src/styles.tsx",
            project.config().extractor_config(),
        );
        let call = &extracted.calls[0];
        let entries = match call.data.first().and_then(|arg| arg.as_ref()) {
            Some(Literal::Object(entries)) => entries.as_slice(),
            _ => panic!("expected object arg"),
        };
        let arg_source = css_call_arg_source(source, call.span).expect("arg source");
        let parsed = parse_object_literal(arg_source).expect("parsed arg");
        let sites = collect_conditional_sites(&parsed, entries);
        assert_eq!(sites.len(), 1);
        let expr = class_expression_for_css_call(&project, source, call.span, &call.data)
            .expect("expression");
        assert_eq!(expr, r#"unk ? "hover:color_red" : "hover:color_blue""#);
    }

    #[test]
    fn collects_nested_hover_conditional_site_at_leaf_path() {
        let source = "{ _hover: { color: unk ? 'red' : 'blue' } }";
        let parsed = parse_object_literal(source).expect("parse object");
        let entries = [(
            "_hover".into(),
            Literal::Object(vec![(
                "color".into(),
                Literal::Conditional(vec![
                    Literal::String("red".into()),
                    Literal::String("blue".into()),
                ]),
            )]),
        )];
        let sites = collect_conditional_sites(&parsed, &entries);
        assert_eq!(sites.len(), 1);
        let ConditionalSite::Property { path, .. } = &sites[0] else {
            panic!("expected property site");
        };
        assert_eq!(path, &["_hover", "color"]);
    }
}
