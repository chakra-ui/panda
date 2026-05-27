use std::cmp::Ordering;

use pandacss_config::{ConditionQuery, UserConfig};
use pandacss_encoder::{Atom, atom_value_sort_key};
use pandacss_project::RecipeStyleEntry;

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
            .map(|condition| condition.as_ref())
            .collect::<Vec<_>>();
        out.sort_by(|a, b| compare_condition_names(self.config, a, b));
        out
    }
}

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
        query_width(raw)
            .map(|query| Self {
                direction: query.direction,
                value: OrderedLength(query.sort_value()),
            })
            .unwrap_or(Self {
                direction: QueryDirection::Unknown,
                value: OrderedLength(f64::INFINITY),
            })
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

pub fn condition_raw_parts(config: &UserConfig, condition: &str) -> Vec<String> {
    let mut at_rules = Vec::new();
    let mut selectors = Vec::new();
    collect_condition_parts(config, condition, &mut at_rules, &mut selectors);
    at_rules.sort();
    selectors.sort();
    let mut parts = Vec::with_capacity(at_rules.len() + selectors.len());
    parts.extend(at_rules.into_iter().map(|part| part.raw));
    parts.extend(selectors.into_iter().map(|part| part.raw));
    parts
}

fn collect_condition_parts(
    config: &UserConfig,
    condition: &str,
    at_rules: &mut Vec<AtRuleKey>,
    selectors: &mut Vec<SelectorKey>,
) {
    if let Some(value) = config.theme.breakpoints.get(condition) {
        at_rules.push(AtRuleKey::new(&format!("@media (width >= {value})")));
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
        ConditionQuery::Array(items) => {
            for item in items {
                collect_raw_part(item, at_rules, selectors);
            }
        }
        ConditionQuery::Nested(items) => {
            for query in items.values() {
                collect_query_parts(query, at_rules, selectors);
            }
        }
    }
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
