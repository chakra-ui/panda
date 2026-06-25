//! Expand `staticCss.patterns` into atoms. Each entry names a configured
//! pattern and a set of prop rules; the pattern's transform callback (when it
//! has one) runs per rule, and the resulting styles are encoded like any other
//! static CSS. Unknown patterns / missing transforms surface as diagnostics.

use pandacss_config::{PatternConfig, PatternPropertyConfig, UserConfig};
use pandacss_encoder::{Atom, ConditionSet, Encoder};
use pandacss_extractor::Literal;
use pandacss_shared::{Diagnostic, diagnostic_codes};
use pandacss_tokens::{TokenCategory, TokenDictionary};
use pandacss_utility::{StyleNormalizer, Utility};
use serde_json::Value;

use crate::PatternTransformFn;
use crate::patterns::PatternRegistry;

/// `(property → selected values, conditions)` parsed from one static-pattern rule object.
type ParsedObjectRule = (Vec<(String, Vec<String>)>, Vec<String>);

pub(crate) fn expand_static_patterns(
    config: &UserConfig,
    pattern_registry: &PatternRegistry,
    utility: Option<&Utility>,
    token_dictionary: Option<&TokenDictionary>,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<Atom> {
    let Some(patterns) = config
        .static_css
        .get("patterns")
        .and_then(Value::as_object)
        .filter(|map| !map.is_empty())
    else {
        return Vec::new();
    };
    let breakpoints = config.theme.breakpoint_names();
    let responsive: Vec<String> = breakpoints
        .iter()
        .filter(|key| key.as_str() != "base")
        .cloned()
        .collect();

    let mut encoder = Encoder::with_conditions(ConditionSet::from_names(
        config.condition_names().iter().map(String::as_str),
    ));
    let ctx = ExpansionCtx {
        config,
        pattern_registry,
        utility,
        token_dictionary,
        breakpoints: &breakpoints,
        responsive: &responsive,
    };

    for (pattern_name, rules_value) in patterns {
        let Some(pattern_config) = config.patterns.get(pattern_name) else {
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::STATIC_CSS_PATTERN_UNKNOWN,
                format!("staticCss.patterns references unknown pattern \"{pattern_name}\""),
            ));
            continue;
        };
        if pattern_config.transform.is_some() && pattern_transform.is_none() {
            diagnostics.push(Diagnostic::warning(
                diagnostic_codes::STATIC_CSS_PATTERN_MISSING_TRANSFORM,
                format!(
                    "staticCss.patterns.\"{pattern_name}\" declares a transform but no pattern_transform callback was provided"
                ),
            ));
            continue;
        }
        let Some(rules) = rules_value.as_array() else {
            continue;
        };
        for rule in rules {
            ctx.emit_rule(
                pattern_name,
                pattern_config,
                rule,
                pattern_transform.as_deref_mut(),
                &mut encoder,
                diagnostics,
            );
        }
    }

    let mut atoms: Vec<Atom> = encoder.into_atoms().into_iter().collect();
    atoms.sort_by(|a, b| a.prop().cmp(b.prop()));
    atoms
}

struct ExpansionCtx<'a> {
    config: &'a UserConfig,
    pattern_registry: &'a PatternRegistry,
    utility: Option<&'a Utility>,
    token_dictionary: Option<&'a TokenDictionary>,
    breakpoints: &'a [String],
    responsive: &'a [String],
}

impl ExpansionCtx<'_> {
    fn emit_rule(
        &self,
        pattern_name: &str,
        pattern_config: &PatternConfig,
        rule: &Value,
        mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
        encoder: &mut Encoder<ConditionSet>,
        diagnostics: &mut Vec<Diagnostic>,
    ) {
        let (per_property_values, conditions) = match rule {
            Value::String(s) if s == "*" => {
                (self.wildcard_pattern_values(pattern_config), Vec::new())
            }
            Value::Object(obj) => match self.parse_object_rule(obj, pattern_config) {
                Some(parsed) => parsed,
                None => return,
            },
            _ => return,
        };

        let normalizer = StyleNormalizer::internal(self.utility, self.breakpoints);

        for (prop_name, values) in &per_property_values {
            for value in values {
                let input = single_prop_object(prop_name, value);
                let prepared = self.pattern_registry.transform_input(pattern_name, &input);
                let transformed = match pattern_transform.as_deref_mut() {
                    Some(transform) => match transform(prepared.name, prepared.styles.as_ref()) {
                        Ok(Some(literal)) => literal,
                        Ok(None) => continue,
                        Err(diagnostic) => {
                            diagnostics.push(diagnostic);
                            continue;
                        }
                    },
                    None => prepared.styles.into_owned(),
                };
                let wrapped = if conditions.is_empty() {
                    transformed
                } else {
                    self.wrap_with_conditions(&conditions, transformed)
                };
                encoder.process_atomic_with(&wrapped, &normalizer);
            }
        }
    }

    fn wildcard_pattern_values(
        &self,
        pattern_config: &PatternConfig,
    ) -> Vec<(String, Vec<String>)> {
        pattern_config
            .properties
            .iter()
            .map(|(name, cfg)| (name.clone(), self.resolve_property_values(cfg)))
            .collect()
    }

    fn parse_object_rule(
        &self,
        rule_obj: &serde_json::Map<String, Value>,
        pattern_config: &PatternConfig,
    ) -> Option<ParsedObjectRule> {
        let properties = rule_obj.get("properties").and_then(Value::as_object)?;
        let mut conditions = string_array(rule_obj.get("conditions"));
        if rule_obj
            .get("responsive")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            conditions.extend(self.responsive.iter().cloned());
        }
        let per_property = properties
            .iter()
            .filter_map(|(prop_name, values)| {
                let cfg = pattern_config.properties.get(prop_name)?;
                Some((prop_name.clone(), self.resolve_rule_values(values, cfg)))
            })
            .collect();
        Some((per_property, conditions))
    }

    fn resolve_rule_values(&self, values: &Value, cfg: &PatternPropertyConfig) -> Vec<String> {
        let listed: Vec<String> = match values {
            Value::Array(items) => items
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect(),
            Value::String(s) => vec![s.clone()],
            _ => return Vec::new(),
        };
        let mut out: Vec<String> = Vec::new();
        for v in listed {
            if v == "*" {
                for expanded in self.resolve_property_values(cfg) {
                    push_unique(&mut out, expanded);
                }
            } else {
                push_unique(&mut out, v);
            }
        }
        out
    }

    fn resolve_property_values(&self, cfg: &PatternPropertyConfig) -> Vec<String> {
        match cfg.r#type.as_deref().unwrap_or("") {
            "enum" => cfg
                .value
                .as_ref()
                .and_then(Value::as_array)
                .map(|items| {
                    items
                        .iter()
                        .filter_map(Value::as_str)
                        .map(str::to_owned)
                        .collect()
                })
                .unwrap_or_default(),
            "boolean" => vec!["true".to_owned(), "false".to_owned()],
            "property" => {
                let prop = cfg
                    .property
                    .as_deref()
                    .or_else(|| cfg.value.as_ref().and_then(Value::as_str))
                    .unwrap_or("");
                if prop.is_empty() {
                    Vec::new()
                } else {
                    self.utility
                        .map(|u| u.property_keys(prop))
                        .unwrap_or_default()
                }
            }
            "token" => cfg
                .value
                .as_ref()
                .and_then(Value::as_str)
                .and_then(|category| {
                    let category = TokenCategory::from_path_segment(category);
                    let values = self.token_dictionary?.category_values_str(&category)?;
                    Some(
                        values
                            .keys()
                            .map(|path| strip_category_prefix(path))
                            .collect(),
                    )
                })
                .unwrap_or_default(),
            _ => Vec::new(),
        }
    }

    fn wrap_with_conditions(&self, conditions: &[String], value: Literal) -> Literal {
        let Literal::Object(entries) = value else {
            return value;
        };
        let mut out = Vec::with_capacity(entries.len());
        for (prop, val) in entries {
            let mut conditional = Vec::with_capacity(1 + conditions.len());
            conditional.push(("base".to_owned(), val.clone()));
            for condition in conditions {
                conditional.push((self.condition_key(condition), val.clone()));
            }
            out.push((prop, Literal::Object(conditional)));
        }
        Literal::Object(out)
    }

    fn condition_key(&self, condition: &str) -> String {
        if self.config.is_condition_key(condition) {
            condition.to_owned()
        } else {
            format!("_{condition}")
        }
    }
}

fn single_prop_object(prop: &str, value: &str) -> Literal {
    Literal::Object(vec![(prop.to_owned(), Literal::String(value.to_owned()))])
}

fn push_unique(out: &mut Vec<String>, value: String) {
    if !out.contains(&value) {
        out.push(value);
    }
}

fn strip_category_prefix(path: &str) -> String {
    path.split_once('.')
        .map_or_else(|| path.to_owned(), |(_, rest)| rest.to_owned())
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect()
        })
        .unwrap_or_default()
}
