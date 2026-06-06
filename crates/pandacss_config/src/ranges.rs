use std::collections::BTreeMap;

use pandacss_shared::{capitalize, to_rem};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ScaleEntry {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RangeCondition {
    pub key: String,
    pub min: Option<String>,
    pub max: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RangeRule {
    pub key: String,
    pub query: String,
}

pub(crate) fn sorted_scale(scale: &BTreeMap<String, String>) -> Vec<ScaleEntry> {
    let mut entries = scale
        .iter()
        .map(|(name, value)| (name.clone(), value.clone(), scale_sort_value(value)))
        .collect::<Vec<_>>();
    entries.sort_by(|(name_a, _, value_a), (name_b, _, value_b)| {
        value_a
            .partial_cmp(value_b)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| name_a.cmp(name_b))
    });
    entries
        .into_iter()
        .map(|(name, value, _)| ScaleEntry { name, value })
        .collect()
}

pub(crate) fn expanded_range_conditions(scale: &BTreeMap<String, String>) -> Vec<RangeCondition> {
    let ranges = sorted_scale(scale);
    let mut out = Vec::new();

    for (index, range) in ranges.iter().enumerate() {
        out.push(RangeCondition {
            key: range.name.clone(),
            min: Some(range.value.clone()),
            max: None,
        });
        out.push(RangeCondition {
            key: format!("{}Down", range.name),
            min: None,
            max: Some(range.value.clone()),
        });

        let next = ranges.get(index + 1).map(|range| range.value.clone());
        out.push(RangeCondition {
            key: format!("{}Only", range.name),
            min: Some(range.value.clone()),
            max: next,
        });

        out.extend(
            ranges
                .iter()
                .skip(index + 1)
                .map(|next_range| RangeCondition {
                    key: format!("{}To{}", range.name, capitalize(&next_range.name)),
                    min: Some(range.value.clone()),
                    max: Some(next_range.value.clone()),
                }),
        );
    }

    out
}

pub(crate) fn range_rules<K, Q>(
    scale: &BTreeMap<String, String>,
    key: K,
    query: Q,
) -> Vec<RangeRule>
where
    K: Fn(&str) -> String,
    Q: Fn(Option<&str>, Option<&str>) -> String,
{
    expanded_range_conditions(scale)
        .into_iter()
        .map(|condition| RangeRule {
            key: key(&condition.key),
            query: query(condition.min.as_deref(), condition.max.as_deref()),
        })
        .collect()
}

pub(crate) fn range_query(feature: &str, min: Option<&str>, max: Option<&str>) -> String {
    match (min, max) {
        (Some(min), Some(max)) => format!(
            "({feature} >= {}) and ({feature} < {})",
            to_rem(min),
            to_rem(max)
        ),
        (Some(min), None) => format!("({feature} >= {})", to_rem(min)),
        (None, Some(max)) => format!("({feature} < {})", to_rem(max)),
        (None, None) => String::new(),
    }
}

/// Numeric weight for sorting string scales by their leading magnitude
/// (`"48rem"` -> `48`). Unparseable values sort last via `INFINITY`.
fn scale_sort_value(value: &str) -> f64 {
    value
        .chars()
        .take_while(|ch| ch.is_ascii_digit() || *ch == '.')
        .collect::<String>()
        .parse()
        .unwrap_or(f64::INFINITY)
}
