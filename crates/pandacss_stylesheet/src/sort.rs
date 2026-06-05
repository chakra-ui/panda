//! Deterministic cascade ordering for emitted rules.
//!
//! Atoms/recipe entries are sorted by a composite [`CssRuleKey`] so the output
//! cascade is stable and correct regardless of extraction order: unconditional
//! rules first, then selector-conditioned, then at-rule-conditioned; within
//! those, by media-query width, pseudo-class priority, and finally property
//! specificity (longhands after shorthands so they win the cascade). Mirrors
//! the JS sort in `packages/core`.

use std::cmp::Ordering;

use pandacss_config::{ConditionQuery, UserConfig};
use pandacss_encoder::{Atom, RecipeStyleEntry, atom_value_sort_key};
use pandacss_shared::to_rem;

const PSEUDO_PRIORITIES: &[(&str, u16)] = &[
    (":is", 40),
    (":where", 40),
    (":not", 40),
    (":has", 45),
    (":dir", 50),
    (":lang", 51),
    (":first-child", 52),
    (":first-of-type", 53),
    (":last-child", 54),
    (":last-of-type", 55),
    (":only-child", 56),
    (":only-of-type", 57),
    (":nth-child", 60),
    (":nth-last-child", 61),
    (":nth-of-type", 62),
    (":nth-last-of-type", 63),
    (":empty", 70),
    (":link", 80),
    (":any-link", 81),
    (":local-link", 82),
    (":target-within", 83),
    (":target", 84),
    (":visited", 85),
    (":enabled", 91),
    (":disabled", 92),
    (":required", 93),
    (":optional", 94),
    (":read-only", 95),
    (":read-write", 96),
    (":placeholder-shown", 97),
    (":in-range", 98),
    (":out-of-range", 99),
    (":default", 100),
    (":checked", 101),
    (":indeterminate", 101),
    (":blank", 102),
    (":valid", 103),
    (":invalid", 104),
    (":user-valid", 105),
    (":user-invalid", 106),
    (":autofill", 110),
    (":picture-in-picture", 120),
    (":modal", 121),
    (":fullscreen", 122),
    (":focus-within", 130),
    (":hover", 140),
    (":focus", 150),
    (":focus-visible", 160),
    (":active", 170),
];

pub struct SortContext<'a> {
    config: &'a UserConfig,
}

pub struct SortedAtom<'a> {
    pub atom: &'a Atom,
    pub conditions: Vec<&'a str>,
}

pub struct SortedRecipeEntry<'a> {
    pub entry: &'a RecipeStyleEntry,
    pub conditions: Vec<&'a str>,
}

impl<'a> SortContext<'a> {
    #[must_use]
    pub fn new(config: &'a UserConfig) -> Self {
        Self { config }
    }

    #[must_use]
    pub fn sorted_atoms(&self, atoms: Vec<&'a Atom>) -> Vec<SortedAtom<'a>> {
        let mut out = atoms
            .into_iter()
            .map(|atom| {
                let conditions = self.sorted_condition_names(atom.conditions());
                let key = CssRuleKey::new(self.config, &conditions, atom.prop());
                (SortedAtom { atom, conditions }, key)
            })
            .collect::<Vec<_>>();
        out.sort_by(|a, b| {
            a.1.cmp(&b.1)
                .then_with(|| a.0.atom.prop().cmp(b.0.atom.prop()))
                .then_with(|| {
                    atom_value_sort_key(a.0.atom.value())
                        .cmp(&atom_value_sort_key(b.0.atom.value()))
                })
                .then_with(|| a.0.conditions.cmp(&b.0.conditions))
        });
        out.into_iter().map(|(atom, _)| atom).collect()
    }

    #[must_use]
    pub fn sorted_recipe_entries(
        &self,
        entries: &'a [RecipeStyleEntry],
    ) -> Vec<SortedRecipeEntry<'a>> {
        let mut out = entries
            .iter()
            .map(|entry| {
                let conditions = self.sorted_condition_names(&entry.conditions);
                let key = CssRuleKey::new(self.config, &conditions, &entry.prop);
                (SortedRecipeEntry { entry, conditions }, key)
            })
            .collect::<Vec<_>>();
        out.sort_by(|a, b| {
            a.1.cmp(&b.1)
                .then_with(|| a.0.entry.prop.cmp(&b.0.entry.prop))
                .then_with(|| {
                    atom_value_sort_key(&a.0.entry.value)
                        .cmp(&atom_value_sort_key(&b.0.entry.value))
                })
                .then_with(|| a.0.conditions.cmp(&b.0.conditions))
        });
        out.into_iter().map(|(entry, _)| entry).collect()
    }

    fn sorted_condition_names<'b>(&self, conditions: &'b [Box<str>]) -> Vec<&'b str> {
        let mut out = conditions
            .iter()
            .map(std::convert::AsRef::as_ref)
            .collect::<Vec<_>>();
        out.sort_by(|a, b| compare_condition_names(self.config, a, b));
        out
    }
}

/// Total sort key for one rule. Fields are compared in declaration order
/// (`bucket` → `at_rules` → `selectors` → `property_priority` → `property_axis`)
/// via the `Ord` impl below — earlier fields dominate.
#[derive(Debug, Clone, Eq, PartialEq)]
struct CssRuleKey {
    bucket: RuleBucket,
    at_rules: Vec<AtRuleKey>,
    selectors: Vec<SelectorKey>,
    property_priority: u16,
    property_axis: u8,
}

impl CssRuleKey {
    fn new(config: &UserConfig, conditions: &[&str], prop: &str) -> Self {
        let mut at_rules = Vec::new();
        let mut selectors = Vec::new();
        for condition in conditions {
            collect_condition_parts(config, condition, &mut at_rules, &mut selectors);
        }
        at_rules.sort();
        selectors.sort();
        Self {
            bucket: RuleBucket::from_parts(&at_rules, &selectors),
            at_rules,
            selectors,
            property_priority: property_priority(prop),
            property_axis: property_axis(prop),
        }
    }
}

impl Ord for CssRuleKey {
    fn cmp(&self, other: &Self) -> Ordering {
        self.bucket
            .cmp(&other.bucket)
            .then_with(|| self.at_rules.cmp(&other.at_rules))
            .then_with(|| self.selectors.cmp(&other.selectors))
            .then_with(|| self.property_priority.cmp(&other.property_priority))
            .then_with(|| self.property_axis.cmp(&other.property_axis))
    }
}

impl PartialOrd for CssRuleKey {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Top-level grouping: unconditional rules emit before selector-conditioned,
/// which emit before at-rule-conditioned. Variant order = cascade order.
#[derive(Debug, Clone, Copy, Eq, PartialEq, Ord, PartialOrd)]
enum RuleBucket {
    Base,
    Selector,
    AtRule,
}

impl RuleBucket {
    fn from_parts(at_rules: &[AtRuleKey], selectors: &[SelectorKey]) -> Self {
        if !at_rules.is_empty() {
            Self::AtRule
        } else if !selectors.is_empty() {
            Self::Selector
        } else {
            Self::Base
        }
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
struct AtRuleKey {
    kind: AtRuleKind,
    query: QueryKey,
    raw: String,
}

impl AtRuleKey {
    fn new(raw: &str) -> Self {
        Self {
            kind: AtRuleKind::new(raw),
            query: QueryKey::new(raw),
            raw: raw.to_owned(),
        }
    }
}

impl Ord for AtRuleKey {
    fn cmp(&self, other: &Self) -> Ordering {
        self.kind
            .cmp(&other.kind)
            .then_with(|| self.query.cmp(&other.query))
            .then_with(|| self.raw.cmp(&other.raw))
    }
}

impl PartialOrd for AtRuleKey {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq, Ord, PartialOrd)]
enum AtRuleKind {
    Supports,
    Media,
    Container,
    Print,
    Other,
}

impl AtRuleKind {
    fn new(raw: &str) -> Self {
        let lower = raw.to_ascii_lowercase();
        if lower.contains("print") {
            Self::Print
        } else if lower.starts_with("@supports") || lower.starts_with("@support") {
            Self::Supports
        } else if lower.starts_with("@media") {
            Self::Media
        } else if lower.starts_with("@container") {
            Self::Container
        } else {
            Self::Other
        }
    }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
struct QueryKey {
    direction: QueryDirection,
    value: OrderedLength,
}

impl QueryKey {
    fn new(raw: &str) -> Self {
        query_width(raw).map_or(
            Self {
                direction: QueryDirection::Unknown,
                value: OrderedLength(f64::INFINITY),
            },
            |query| Self {
                direction: query.direction,
                value: OrderedLength(query.sort_value()),
            },
        )
    }
}

impl Ord for QueryKey {
    fn cmp(&self, other: &Self) -> Ordering {
        self.direction
            .cmp(&other.direction)
            .then_with(|| self.value.cmp(&other.value))
    }
}

impl PartialOrd for QueryKey {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq, Ord, PartialOrd)]
enum QueryDirection {
    Max,
    Min,
    Unknown,
}

#[derive(Debug, Clone, Copy)]
struct QueryWidth {
    direction: QueryDirection,
    value: f64,
}

impl QueryWidth {
    /// Sort weight: `min-width` ascends (mobile-first), `max-width` descends
    /// (negated) so the larger breakpoint comes first — matching how each
    /// direction must cascade.
    fn sort_value(self) -> f64 {
        match self.direction {
            QueryDirection::Min | QueryDirection::Unknown => self.value,
            QueryDirection::Max => -self.value,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct OrderedLength(f64);

impl Eq for OrderedLength {}

impl Ord for OrderedLength {
    fn cmp(&self, other: &Self) -> Ordering {
        self.0.partial_cmp(&other.0).unwrap_or(Ordering::Equal)
    }
}

impl PartialOrd for OrderedLength {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
struct SelectorKey {
    pseudo_rank: u16,
    pseudo_element: bool,
    raw: String,
}

impl SelectorKey {
    fn new(raw: &str) -> Self {
        Self {
            pseudo_rank: pseudo_rank(raw),
            pseudo_element: is_pseudo_element(raw),
            raw: raw.to_owned(),
        }
    }
}

impl Ord for SelectorKey {
    fn cmp(&self, other: &Self) -> Ordering {
        self.pseudo_element
            .cmp(&other.pseudo_element)
            .then_with(|| self.pseudo_rank.cmp(&other.pseudo_rank))
            .then_with(|| self.raw.cmp(&other.raw))
    }
}

impl PartialOrd for SelectorKey {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn compare_condition_names(config: &UserConfig, a: &str, b: &str) -> Ordering {
    let mut a_at_rules = Vec::new();
    let mut a_selectors = Vec::new();
    collect_condition_parts(config, a, &mut a_at_rules, &mut a_selectors);
    a_at_rules.sort();
    a_selectors.sort();

    let mut b_at_rules = Vec::new();
    let mut b_selectors = Vec::new();
    collect_condition_parts(config, b, &mut b_at_rules, &mut b_selectors);
    b_at_rules.sort();
    b_selectors.sort();

    compare_condition_apply_parts(&a_at_rules, &a_selectors, &b_at_rules, &b_selectors)
        .then_with(|| a.cmp(b))
}

fn compare_condition_apply_parts(
    a_at_rules: &[AtRuleKey],
    a_selectors: &[SelectorKey],
    b_at_rules: &[AtRuleKey],
    b_selectors: &[SelectorKey],
) -> Ordering {
    if !a_selectors.is_empty() || !b_selectors.is_empty() {
        return compare_apply_selectors(a_selectors, b_selectors)
            .then_with(|| a_at_rules.cmp(b_at_rules));
    }
    a_at_rules.cmp(b_at_rules)
}

fn compare_apply_selectors(a: &[SelectorKey], b: &[SelectorKey]) -> Ordering {
    match (a.is_empty(), b.is_empty()) {
        (false, false) => a.cmp(b),
        (false, true) => Ordering::Less,
        (true, false) => Ordering::Greater,
        (true, true) => Ordering::Equal,
    }
}

#[must_use]
fn breakpoint_media_query(value: &str) -> String {
    format!("@media (width >= {})", to_rem(value))
}

pub fn condition_raw_paths(config: &UserConfig, condition: &str) -> Vec<Vec<String>> {
    if let Some(value) = config.theme.breakpoints.get(condition) {
        return vec![vec![breakpoint_media_query(value)]];
    }

    let key = condition.trim_start_matches('_');
    let query = config
        .conditions
        .get(condition)
        .or_else(|| config.conditions.get(key));

    if let Some(query) = query {
        return query_raw_paths(query);
    }

    if let Some(raw) = config.theme_condition(condition) {
        return vec![vec![raw]];
    }

    if condition.starts_with('@') || condition.contains('&') {
        return vec![vec![condition.to_owned()]];
    }

    Vec::new()
}

fn collect_condition_parts(
    config: &UserConfig,
    condition: &str,
    at_rules: &mut Vec<AtRuleKey>,
    selectors: &mut Vec<SelectorKey>,
) {
    if let Some(value) = config.theme.breakpoints.get(condition) {
        at_rules.push(AtRuleKey::new(&breakpoint_media_query(value)));
        return;
    }

    let key = condition.trim_start_matches('_');
    let query = config
        .conditions
        .get(condition)
        .or_else(|| config.conditions.get(key));

    if let Some(query) = query {
        collect_query_parts(query, at_rules, selectors);
        return;
    }

    if let Some(raw) = config.theme_condition(condition) {
        collect_raw_part(&raw, at_rules, selectors);
        return;
    }

    if condition.starts_with('@') || condition.contains('&') {
        collect_raw_part(condition, at_rules, selectors);
    }
}

fn collect_query_parts(
    query: &ConditionQuery,
    at_rules: &mut Vec<AtRuleKey>,
    selectors: &mut Vec<SelectorKey>,
) {
    match query {
        ConditionQuery::String(value) => collect_raw_part(value, at_rules, selectors),
        ConditionQuery::Nested(items) => {
            for (raw, query) in items {
                collect_raw_part(raw, at_rules, selectors);
                match query {
                    ConditionQuery::String(value) if value == "@slot" => {}
                    _ => collect_query_parts(query, at_rules, selectors),
                }
            }
        }
    }
}

fn query_raw_paths(query: &ConditionQuery) -> Vec<Vec<String>> {
    match query {
        ConditionQuery::String(value) => vec![vec![value.clone()]],
        ConditionQuery::Nested(items) => block_raw_paths(items),
    }
}

fn block_raw_paths(items: &std::collections::BTreeMap<String, ConditionQuery>) -> Vec<Vec<String>> {
    let mut paths = Vec::new();
    for (raw, query) in items {
        match query {
            ConditionQuery::String(value) if value == "@slot" => {
                paths.push(vec![raw.clone()]);
            }
            ConditionQuery::String(_) => {}
            ConditionQuery::Nested(children) => {
                for mut path in block_raw_paths(children) {
                    path.insert(0, raw.clone());
                    paths.push(path);
                }
            }
        }
    }
    paths
}

fn collect_raw_part(raw: &str, at_rules: &mut Vec<AtRuleKey>, selectors: &mut Vec<SelectorKey>) {
    let raw = raw.trim();
    if raw.is_empty() {
        return;
    }
    if raw.starts_with('@') {
        at_rules.push(AtRuleKey::new(raw));
    } else {
        selectors.push(SelectorKey::new(raw));
    }
}

fn query_width(query: &str) -> Option<QueryWidth> {
    let lower = query.to_ascii_lowercase();
    if let Some(value) = length_after(&lower, "width >=")
        .or_else(|| length_after(&lower, "min-width:"))
        .or_else(|| length_after(&lower, "min-width "))
    {
        return Some(QueryWidth {
            direction: QueryDirection::Min,
            value,
        });
    }
    if let Some(value) = length_after(&lower, "width <")
        .or_else(|| length_after(&lower, "max-width:"))
        .or_else(|| length_after(&lower, "max-width "))
    {
        return Some(QueryWidth {
            direction: QueryDirection::Max,
            value,
        });
    }
    None
}

fn length_after(query: &str, needle: &str) -> Option<f64> {
    let index = query.find(needle)? + needle.len();
    parse_length_px(&query[index..])
}

/// Parse a leading length into px-equivalent so different units sort
/// comparably. `em`/`rem`/`ch`/`ex` use default-font-metric approximations;
/// unknown units sort last (`INFINITY`).
fn parse_length_px(input: &str) -> Option<f64> {
    let input = input.trim_start_matches(|ch: char| ch.is_whitespace() || ch == '(');
    let number_len = input
        .chars()
        .take_while(|ch| ch.is_ascii_digit() || *ch == '.' || *ch == '-')
        .map(char::len_utf8)
        .sum::<usize>();
    if number_len == 0 {
        return None;
    }
    let number = input[..number_len].parse::<f64>().ok()?;
    let unit = input[number_len..]
        .chars()
        .take_while(|ch| ch.is_ascii_alphabetic() || *ch == '%')
        .collect::<String>();
    Some(match unit.as_str() {
        "em" | "rem" => number * 16.0,
        "ch" => number * 8.898_437_5,
        "ex" => number * 8.296_875,
        "px" | "" => number,
        _ => f64::INFINITY,
    })
}

fn pseudo_rank(selector: &str) -> u16 {
    let mut rank = 0;
    for pseudo in pseudo_classes(selector) {
        rank += pseudo_priority(pseudo);
    }
    rank
}

fn pseudo_priority(pseudo: &str) -> u16 {
    PSEUDO_PRIORITIES
        .iter()
        .find_map(|(name, priority)| (*name == pseudo).then_some(*priority))
        .unwrap_or(40)
}

/// Iterate the pseudo-*classes* (`:hover`, `:focus`, …) in a selector,
/// skipping pseudo-*elements* (`::before`) which don't affect class priority.
fn pseudo_classes(selector: &str) -> PseudoClasses<'_> {
    PseudoClasses {
        selector,
        position: 0,
    }
}

struct PseudoClasses<'a> {
    selector: &'a str,
    position: usize,
}

impl<'a> Iterator for PseudoClasses<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<Self::Item> {
        let bytes = self.selector.as_bytes();
        while self.position < bytes.len() {
            let index = self.position;
            self.position += 1;
            if bytes[index] != b':' {
                continue;
            }
            if bytes.get(index + 1) == Some(&b':') {
                self.position += 1;
                continue;
            }
            let start = index;
            let mut end = index + 1;
            while let Some(ch) = bytes.get(end).copied() {
                if ch.is_ascii_alphabetic() || ch == b'-' {
                    end += 1;
                } else {
                    break;
                }
            }
            if end > start + 1 {
                self.position = end;
                return Some(&self.selector[start..end]);
            }
        }
        None
    }
}

fn is_pseudo_element(selector: &str) -> bool {
    selector.contains("::")
}

/// Order property names by the canonical emit cascade (breadth → axis → name).
/// Stable + deterministic; used by tooling to present a consistent property
/// order (e.g. a formatter sorting style-object keys).
#[must_use]
pub fn order_properties<'a>(props: impl IntoIterator<Item = &'a str>) -> Vec<String> {
    let mut props: Vec<&str> = props.into_iter().collect();
    props.sort_by(|a, b| {
        property_priority(a)
            .cmp(&property_priority(b))
            .then_with(|| property_axis(a).cmp(&property_axis(b)))
            .then_with(|| a.cmp(b))
    });
    props.into_iter().map(ToOwned::to_owned).collect()
}

/// Cascade weight by property breadth: `all` and custom props first, then
/// shorthands-of-shorthands → shorthands → logical longhands → physical
/// longhands. Longhands rank highest so they override the shorthands they
/// expand within the same layer.
fn property_priority(prop: &str) -> u16 {
    if prop == "all" {
        return 0;
    }
    if prop.starts_with("--") {
        return 1;
    }
    if is_longhand_physical(prop) {
        return 4000;
    }
    if is_longhand_logical(prop) {
        return 3000;
    }
    if is_shorthand_of_longhands(prop) {
        return 2000;
    }
    if is_shorthand_of_shorthands(prop) {
        return 1000;
    }
    3000
}

fn property_axis(prop: &str) -> u8 {
    if prop.contains("Inline") || prop.ends_with('X') {
        0
    } else if prop.contains("Block") || prop.ends_with('Y') {
        1
    } else {
        2
    }
}

fn is_shorthand_of_shorthands(prop: &str) -> bool {
    matches!(
        prop,
        "animation"
            | "background"
            | "border"
            | "borderBlock"
            | "borderInline"
            | "font"
            | "grid"
            | "gridTemplate"
            | "gridArea"
            | "inset"
            | "margin"
            | "padding"
            | "scrollMargin"
            | "scrollPadding"
    )
}

fn is_shorthand_of_longhands(prop: &str) -> bool {
    matches!(
        prop,
        "animationRange"
            | "backgroundPosition"
            | "borderColor"
            | "borderStyle"
            | "borderWidth"
            | "borderBlockStart"
            | "borderTop"
            | "borderBlockEnd"
            | "borderBottom"
            | "borderInlineColor"
            | "borderInlineStyle"
            | "borderInlineWidth"
            | "borderInlineStart"
            | "borderLeft"
            | "borderInlineEnd"
            | "borderRight"
            | "borderImage"
            | "borderRadius"
            | "caret"
            | "outline"
            | "gridGap"
            | "gap"
            | "placeContent"
            | "placeItems"
            | "placeSelf"
            | "marginBlock"
            | "marginInline"
            | "paddingBlock"
            | "paddingInline"
            | "overscrollBehavior"
            | "columns"
            | "columnRule"
            | "containIntrinsicSize"
            | "container"
            | "flex"
            | "flexFlow"
            | "fontVariant"
            | "gridTemplateAreas"
            | "gridRow"
            | "gridColumn"
            | "listStyle"
            | "mask"
            | "maskBorder"
            | "offset"
            | "overflow"
            | "insetBlock"
            | "insetInline"
            | "scrollMarginBlock"
            | "scrollMarginInline"
            | "scrollPaddingBlock"
            | "scrollPaddingInline"
            | "scrollSnapType"
            | "textDecoration"
            | "textEmphasis"
            | "textWrap"
            | "transition"
    )
}

fn is_longhand_physical(prop: &str) -> bool {
    matches!(
        prop,
        "height"
            | "width"
            | "maxHeight"
            | "maxWidth"
            | "minHeight"
            | "minWidth"
            | "borderTopColor"
            | "borderTopStyle"
            | "borderTopWidth"
            | "borderBottomColor"
            | "borderBottomStyle"
            | "borderBottomWidth"
            | "borderLeftColor"
            | "borderLeftStyle"
            | "borderLeftWidth"
            | "borderRightColor"
            | "borderRightStyle"
            | "borderRightWidth"
            | "borderTopLeftRadius"
            | "borderTopRightRadius"
            | "borderBottomLeftRadius"
            | "borderBottomRightRadius"
            | "marginTop"
            | "marginBottom"
            | "marginLeft"
            | "marginRight"
            | "paddingTop"
            | "paddingBottom"
            | "paddingLeft"
            | "paddingRight"
            | "top"
            | "bottom"
            | "left"
            | "right"
            | "overflowX"
            | "overflowY"
            | "scrollMarginTop"
            | "scrollMarginBottom"
            | "scrollMarginLeft"
            | "scrollMarginRight"
            | "scrollPaddingTop"
            | "scrollPaddingBottom"
            | "scrollPaddingLeft"
            | "scrollPaddingRight"
    )
}

fn is_longhand_logical(prop: &str) -> bool {
    matches!(
        prop,
        "backgroundBlendMode"
            | "isolation"
            | "mixBlendMode"
            | "animationComposition"
            | "animationDelay"
            | "animationDirection"
            | "animationDuration"
            | "animationFillMode"
            | "animationIterationCount"
            | "animationName"
            | "animationPlayState"
            | "animationRangeEnd"
            | "animationRangeStart"
            | "animationTimingFunction"
            | "animationTimeline"
            | "backgroundAttachment"
            | "backgroundClip"
            | "backgroundColor"
            | "backgroundImage"
            | "backgroundOrigin"
            | "backgroundRepeat"
            | "backgroundSize"
            | "backgroundPositionX"
            | "backgroundPositionY"
            | "borderBlockColor"
            | "borderBlockStyle"
            | "borderBlockWidth"
            | "borderBlockStartColor"
            | "borderBlockStartStyle"
            | "borderBlockStartWidth"
            | "borderBlockEndColor"
            | "borderBlockEndStyle"
            | "borderBlockEndWidth"
            | "borderInlineStartColor"
            | "borderInlineStartStyle"
            | "borderInlineStartWidth"
            | "borderInlineEndColor"
            | "borderInlineEndStyle"
            | "borderInlineEndWidth"
            | "borderImageOutset"
            | "borderImageRepeat"
            | "borderImageSlice"
            | "borderImageSource"
            | "borderImageWidth"
            | "borderStartEndRadius"
            | "borderStartStartRadius"
            | "borderEndEndRadius"
            | "borderEndStartRadius"
            | "boxShadow"
            | "accentColor"
            | "appearance"
            | "aspectRatio"
            | "boxSizing"
            | "blockSize"
            | "inlineSize"
            | "marginBlockStart"
            | "marginBlockEnd"
            | "marginInlineStart"
            | "marginInlineEnd"
            | "paddingBlockStart"
            | "paddingBlockEnd"
            | "paddingInlineStart"
            | "paddingInlineEnd"
            | "visibility"
            | "color"
            | "opacity"
            | "display"
            | "flexBasis"
            | "flexGrow"
            | "flexShrink"
            | "fontFamily"
            | "fontSize"
            | "fontStyle"
            | "fontWeight"
            | "lineHeight"
            | "gridAutoFlow"
            | "gridAutoRows"
            | "gridAutoColumns"
            | "gridTemplateColumns"
            | "gridTemplateRows"
            | "gridRowStart"
            | "gridRowEnd"
            | "gridColumnStart"
            | "gridColumnEnd"
            | "position"
            | "zIndex"
            | "textAlign"
            | "textDecorationColor"
            | "textDecorationLine"
            | "textDecorationStyle"
            | "textDecorationThickness"
            | "transform"
            | "transformOrigin"
            | "transitionDelay"
            | "transitionDuration"
            | "transitionProperty"
            | "transitionTimingFunction"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn breakpoint_media_query_converts_px_to_rem() {
        assert_eq!(
            breakpoint_media_query("768px"),
            "@media (width >= 48rem)"
        );
        assert_eq!(
            breakpoint_media_query("960px"),
            "@media (width >= 60rem)"
        );
    }

    #[test]
    fn parse_length_px_normalizes_units_for_sorting() {
        assert_eq!(parse_length_px("768px"), Some(768.0));
        assert_eq!(parse_length_px("48rem"), Some(768.0));
        assert_eq!(parse_length_px("100%"), Some(f64::INFINITY));
    }

    #[test]
    fn at_rule_key_orders_min_width_breakpoints_ascending() {
        let sm = AtRuleKey::new("@media (width >= 40rem)");
        let lg = AtRuleKey::new("@media (width >= 64rem)");
        assert!(sm < lg);
    }

    #[test]
    fn at_rule_key_orders_supports_before_media() {
        let supports = AtRuleKey::new("@supports (display: grid)");
        let media = AtRuleKey::new("@media (width >= 48rem)");
        assert!(supports < media);
    }
}
