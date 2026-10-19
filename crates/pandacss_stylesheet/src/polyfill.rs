//! Cascade-layer polyfill — emit-time port of v1's cascade layers polyfill.
//!
//! Boosts need the full sheet: record [`SheetOp`]s via
//! [`CssWriter`](crate::writer::CssWriter), then analyze
//! (`step = maxIds + 1`, nested preamble ranks) and flatten to flat CSS with
//! compact `:not(#\##\#…)` amounts. Split reuses the merged [`AnalyzeResult`].

use std::collections::HashMap;
use std::ops::Range;

use pandacss_config::CascadeLayers;

use crate::StylesheetLayerRanges;
use crate::selector_parts::{PartKind, selector_parts};

const NOT_ID: &str = "#\\#";

#[derive(Debug, Clone)]
pub(crate) enum SheetOp {
    LayerEnter(String),
    LayerExit,
    Rule {
        selector: String,
        decls: Vec<Decl>,
    },
    /// Descriptor inside `@font-face` / `@property` / `@position-try` (no selector).
    Declaration(Decl),
    AtRule {
        prelude: String,
        ops: Vec<SheetOp>,
    },
    Raw(String),
}

#[derive(Debug, Clone)]
pub(crate) struct Decl {
    pub prop: String,
    pub value: String,
    pub important: bool,
}

#[derive(Debug, Clone)]
pub(crate) struct AnalyzeResult {
    pub ranks: HashMap<String, u32>,
    pub step: u32,
    /// Highest rank, for inverting `!important` priority.
    pub max_rank: u32,
}

#[derive(Debug)]
pub(crate) struct FlattenOutput {
    pub css: String,
    pub layer_ranges: StylesheetLayerRanges,
}

#[must_use]
pub(crate) fn analyze(ops: &[SheetOp], layers: &CascadeLayers) -> AnalyzeResult {
    let mut max_ids = 0_u32;
    let mut stack = Vec::new();
    let mut discovered = Vec::new();
    walk_analyze(ops, &mut stack, &mut discovered, &mut max_ids);
    let ranks = crate::cascade::CascadePlan::with_discovered(layers, &discovered).rank_map();
    let max_rank = ranks.values().copied().max().unwrap_or(0);
    AnalyzeResult {
        ranks,
        step: max_ids.saturating_add(1).max(1),
        max_rank,
    }
}

fn walk_analyze(
    ops: &[SheetOp],
    stack: &mut Vec<String>,
    discovered: &mut Vec<Vec<String>>,
    max_ids: &mut u32,
) {
    for op in ops {
        match op {
            SheetOp::LayerEnter(name) => {
                stack.push(name.clone());
            }
            SheetOp::LayerExit => {
                stack.pop();
            }
            SheetOp::Rule { selector, .. } => {
                if !stack.is_empty() {
                    discovered.push(stack.clone());
                }
                *max_ids = (*max_ids).max(count_id_selectors(selector));
            }
            SheetOp::AtRule { ops, .. } => {
                walk_analyze(ops, stack, discovered, max_ids);
            }
            SheetOp::Declaration(_) => {
                if !stack.is_empty() {
                    discovered.push(stack.clone());
                }
            }
            SheetOp::Raw(_) => {}
        }
    }
}

#[must_use]
pub(crate) fn flatten(
    ops: &[SheetOp],
    analyze: &AnalyzeResult,
    layers: &CascadeLayers,
    minify: bool,
) -> FlattenOutput {
    let mut out = String::new();
    let mut layer_ranges = StylesheetLayerRanges::default();
    let mut stack = Vec::new();
    let mut top_level_start: Option<(String, usize)> = None;
    let mut walk = FlattenWalk {
        analyze,
        layers,
        minify,
        out: &mut out,
        stack: &mut stack,
        top_level_start: &mut top_level_start,
        layer_ranges: &mut layer_ranges,
    };
    flatten_ops(ops, &mut walk, 0, true);
    FlattenOutput {
        css: out,
        layer_ranges,
    }
}

/// `@keyframes` selectors (`from`/`to`/`50%`) aren't real selectors — no
/// pseudo-class is valid there, so boosting them breaks the whole block.
fn is_non_selector_block_at_rule(prelude: &str) -> bool {
    prelude.starts_with("@keyframes")
}

/// Mutable CSS buffer + layer-range state threaded through the flatten walker.
struct FlattenWalk<'a> {
    analyze: &'a AnalyzeResult,
    layers: &'a CascadeLayers,
    minify: bool,
    out: &'a mut String,
    stack: &'a mut Vec<String>,
    top_level_start: &'a mut Option<(String, usize)>,
    layer_ranges: &'a mut StylesheetLayerRanges,
}

fn flatten_ops(ops: &[SheetOp], walk: &mut FlattenWalk<'_>, indent: usize, boost: bool) {
    for op in ops {
        match op {
            SheetOp::LayerEnter(name) => {
                if walk.stack.is_empty() {
                    *walk.top_level_start = Some((name.clone(), walk.out.len()));
                }
                walk.stack.push(name.clone());
            }
            SheetOp::LayerExit => {
                walk.stack.pop();
                if walk.stack.is_empty()
                    && let Some((name, start)) = walk.top_level_start.take()
                {
                    assign_top_level_range(
                        walk.layer_ranges,
                        walk.layers,
                        &name,
                        start..walk.out.len(),
                    );
                }
            }
            SheetOp::Rule { selector, decls } => {
                if boost {
                    write_rule(walk, indent, selector, decls);
                } else {
                    write_rule_block(walk.out, walk.minify, indent, selector, decls);
                }
            }
            SheetOp::Declaration(decl) => {
                write_declaration(walk.out, walk.minify, indent, decl);
            }
            SheetOp::AtRule { prelude, ops } => {
                write_indent(walk.out, walk.minify, indent);
                walk.out.push_str(prelude);
                open_block(walk.out, walk.minify);
                flatten_ops(
                    ops,
                    walk,
                    indent + 1,
                    boost && !is_non_selector_block_at_rule(prelude),
                );
                write_indent(walk.out, walk.minify, indent);
                walk.out.push('}');
                if !walk.minify {
                    walk.out.push('\n');
                }
            }
            SheetOp::Raw(raw) => walk.out.push_str(raw),
        }
    }
}

/// `!important` inverts layer priority, so a rule mixing important and
/// non-important decls splits into two blocks with opposite amounts.
fn write_rule(walk: &mut FlattenWalk<'_>, indent: usize, selector: &str, decls: &[Decl]) {
    if decls.iter().any(|decl| decl.important) {
        let normal: Vec<&Decl> = decls.iter().filter(|decl| !decl.important).collect();
        let important: Vec<&Decl> = decls.iter().filter(|decl| decl.important).collect();
        if !normal.is_empty() {
            let amount = specificity_amount(walk.analyze, walk.stack);
            write_rule_with_amount(
                walk.out,
                walk.minify,
                indent,
                selector,
                amount,
                normal.iter().copied(),
            );
        }
        if !important.is_empty() {
            let amount = important_specificity_amount(walk.analyze, walk.stack);
            write_rule_with_amount(
                walk.out,
                walk.minify,
                indent,
                selector,
                amount,
                important.iter().copied(),
            );
        }
        return;
    }
    let amount = specificity_amount(walk.analyze, walk.stack);
    write_rule_with_amount(walk.out, walk.minify, indent, selector, amount, decls);
}

fn write_rule_with_amount<'a>(
    out: &mut String,
    minify: bool,
    indent: usize,
    selector: &str,
    amount: u32,
    decls: impl IntoIterator<Item = &'a Decl>,
) {
    let boosted = if amount == 0 {
        selector.to_owned()
    } else {
        adjust_selector_specificity(selector, amount)
    };
    write_rule_block(out, minify, indent, &boosted, decls);
}

fn rank_for_stack(analyze: &AnalyzeResult, stack: &[String]) -> Option<u32> {
    if stack.is_empty() {
        return None;
    }
    let path = stack.join(".");
    Some(rank_for_path(&analyze.ranks, &path))
}

fn specificity_amount(analyze: &AnalyzeResult, stack: &[String]) -> u32 {
    rank_for_stack(analyze, stack).map_or(0, |rank| rank.saturating_mul(analyze.step))
}

/// Inverse of [`specificity_amount`], plus one step to beat unlayered `!important`.
fn important_specificity_amount(analyze: &AnalyzeResult, stack: &[String]) -> u32 {
    rank_for_stack(analyze, stack).map_or(0, |rank| {
        analyze
            .max_rank
            .saturating_sub(rank)
            .saturating_add(1)
            .saturating_mul(analyze.step)
    })
}

fn assign_top_level_range(
    ranges: &mut StylesheetLayerRanges,
    layers: &CascadeLayers,
    name: &str,
    range: Range<usize>,
) {
    if name == layers.reset {
        ranges.reset = Some(range);
    } else if name == layers.base {
        ranges.base = Some(range);
    } else if name == layers.tokens {
        ranges.tokens = Some(range);
    } else if name == layers.recipes {
        ranges.recipes = Some(range);
    } else if name == layers.utilities {
        ranges.utilities = Some(range);
    }
}

fn write_rule_block<'a>(
    out: &mut String,
    minify: bool,
    indent: usize,
    selector: &str,
    decls: impl IntoIterator<Item = &'a Decl>,
) {
    write_indent(out, minify, indent);
    out.push_str(selector);
    open_block(out, minify);
    for decl in decls {
        write_declaration(out, minify, indent + 1, decl);
    }
    write_indent(out, minify, indent);
    out.push('}');
    if !minify {
        out.push('\n');
    }
}

fn write_declaration(out: &mut String, minify: bool, indent: usize, decl: &Decl) {
    write_indent(out, minify, indent);
    out.push_str(&decl.prop);
    out.push(':');
    if !minify {
        out.push(' ');
    }
    out.push_str(&decl.value);
    if decl.important {
        out.push_str(" !important");
    }
    out.push(';');
    if !minify {
        out.push('\n');
    }
}

fn open_block(out: &mut String, minify: bool) {
    if !minify {
        out.push(' ');
    }
    out.push('{');
    if !minify {
        out.push('\n');
    }
}

fn write_indent(out: &mut String, minify: bool, indent: usize) {
    if minify {
        return;
    }
    for _ in 0..indent {
        out.push_str("  ");
    }
}

#[must_use]
pub(crate) fn rank_for_path(ranks: &HashMap<String, u32>, path: &str) -> u32 {
    if let Some(&rank) = ranks.get(path) {
        return rank;
    }
    if let Some((parent, _)) = path.rsplit_once('.')
        && let Some(&parent_rank) = ranks.get(parent)
    {
        return parent_rank.saturating_add(1);
    }
    let mut current = path;
    while let Some((parent, _)) = current.rsplit_once('.') {
        if let Some(&parent_rank) = ranks.get(parent) {
            return parent_rank.saturating_add(1);
        }
        current = parent;
    }
    ranks.values().copied().max().unwrap_or(0)
}

#[must_use]
pub(crate) fn adjust_selector_specificity(selector: &str, amount: u32) -> String {
    if amount == 0 {
        return selector.to_owned();
    }
    let suffix = specificity_suffix_amount(amount);
    let points = insertion_points(selector);
    let mut out = String::with_capacity(selector.len() + suffix.len() * points.len());
    let mut copied = 0;
    for point in points {
        out.push_str(&selector[copied..point]);
        out.push_str(&suffix);
        copied = point;
    }
    out.push_str(&selector[copied..]);
    out
}

#[must_use]
pub(crate) fn specificity_suffix_amount(amount: u32) -> String {
    if amount == 0 {
        return String::new();
    }
    let mut inner = String::with_capacity(NOT_ID.len() * amount as usize);
    for _ in 0..amount {
        inner.push_str(NOT_ID);
    }
    format!(":not({inner})")
}

/// Where each complex selector takes its boost: before its first combinator or
/// pseudo-element, else after its last compound.
fn insertion_points(selector: &str) -> Vec<usize> {
    let mut points = Vec::new();
    let mut compound_end = None;
    let mut placed = false;
    for part in selector_parts(selector) {
        match part.kind {
            PartKind::Comma => {
                if !placed {
                    points.extend(compound_end);
                }
                compound_end = None;
                placed = false;
            }
            PartKind::Combinator | PartKind::Pseudo { element: true, .. } if !placed => {
                points.push(part.span.start);
                placed = true;
            }
            _ => compound_end = Some(part.span.end),
        }
    }
    if !placed {
        points.extend(compound_end);
    }
    points
}

/// Specificity **A** (ID column) of a selector list, for polyfill
/// `step = maxA + 1`: the max across its complex selectors.
fn count_id_selectors(selector: &str) -> u32 {
    let mut max = 0;
    let mut current = 0;
    for part in selector_parts(selector) {
        match part.kind {
            PartKind::Comma => {
                max = max.max(current);
                current = 0;
            }
            PartKind::Id => current += 1,
            PartKind::Pseudo {
                element,
                name,
                args: Some(args),
            } => current += pseudo_argument_ids(element, name, args),
            _ => {}
        }
    }
    max.max(current)
}

/// IDs a functional pseudo takes from its selector argument (Selectors 4).
fn pseudo_argument_ids(element: bool, name: &str, args: &str) -> u32 {
    let named = |candidates: &[&str]| candidates.iter().any(|c| name.eq_ignore_ascii_case(c));
    if element {
        return if named(&["slotted"]) {
            count_id_selectors(args)
        } else {
            0
        };
    }
    if named(&[
        "is",
        "matches",
        "-moz-any",
        "not",
        "has",
        "host",
        "host-context",
    ]) {
        return count_id_selectors(args);
    }
    if named(&["nth-child", "nth-last-child"]) {
        // `An+B of S` counts `S`.
        return selector_parts(args)
            .find(|part| {
                part.kind == PartKind::Other && args[part.span.clone()].eq_ignore_ascii_case("of")
            })
            .map_or(0, |of| count_id_selectors(&args[of.span.end..]));
    }
    0
}

#[cfg(test)]
mod boost_tests;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adjust_appends_when_no_combinator() {
        assert_eq!(
            adjust_selector_specificity("target", 2),
            "target:not(#\\##\\#)"
        );
    }

    #[test]
    fn adjust_inserts_before_descendant_combinator() {
        assert_eq!(
            adjust_selector_specificity("span h1", 2),
            "span:not(#\\##\\#) h1"
        );
    }

    #[test]
    fn adjust_inserts_before_child_combinator() {
        assert_eq!(adjust_selector_specificity("a > b", 1), "a:not(#\\#) > b");
    }

    #[test]
    fn adjust_inserts_before_pseudo_element() {
        assert_eq!(
            adjust_selector_specificity("target:before", 2),
            "target:not(#\\##\\#):before"
        );
        assert_eq!(
            adjust_selector_specificity(".btn::before", 1),
            ".btn:not(#\\#)::before"
        );
    }

    #[test]
    fn adjust_selector_list_applies_per_branch() {
        assert_eq!(
            adjust_selector_specificity("span h1, span p", 2),
            "span:not(#\\##\\#) h1, span:not(#\\##\\#) p"
        );
    }

    #[test]
    fn adjust_zero_is_identity() {
        assert_eq!(adjust_selector_specificity(".btn:hover", 0), ".btn:hover");
    }

    #[test]
    fn nested_recipe_layers_have_distinct_increasing_ranks() {
        let ranks =
            crate::cascade::CascadePlan::with_discovered(&CascadeLayers::default(), &[]).rank_map();
        assert!(ranks["recipes.base"] < ranks["recipes.variants"]);
        assert!(ranks["recipes.variants"] < ranks["recipes.compound_variants"]);
        assert!(ranks["recipes.slots.base"] < ranks["recipes.slots.variants"]);
        assert!(ranks["recipes.compound_variants"] < ranks["utilities"]);
        assert!(ranks["base"] < ranks["recipes.base"]);
    }

    #[test]
    fn analyze_step_is_one_without_ids() {
        let ops = [SheetOp::Rule {
            selector: ".c_red".into(),
            decls: vec![],
        }];
        let result = analyze(&ops, &CascadeLayers::default());
        assert_eq!(result.step, 1);
    }

    #[test]
    fn analyze_step_grows_with_ids_in_any_selector() {
        let ops = [
            SheetOp::LayerEnter("base".into()),
            SheetOp::AtRule {
                prelude: "@media (width >= 40rem)".into(),
                ops: vec![SheetOp::Rule {
                    selector: "#a #b".into(),
                    decls: vec![],
                }],
            },
            SheetOp::LayerExit,
            SheetOp::LayerEnter("utilities".into()),
            SheetOp::Rule {
                selector: ".c_red".into(),
                decls: vec![],
            },
            SheetOp::LayerExit,
        ];
        let result = analyze(&ops, &CascadeLayers::default());
        assert_eq!(result.step, 3);
    }

    #[test]
    fn unquoted_attribute_hash_is_not_an_id_selector() {
        assert_eq!(count_id_selectors(r"[href=#foo]"), 0);
        assert_eq!(count_id_selectors(r##"[href="#foo"]"##), 0);
        assert_eq!(count_id_selectors("#real-id[href=#foo]"), 1);
    }

    #[test]
    fn later_layer_beats_earlier_even_with_ids() {
        let ranks =
            crate::cascade::CascadePlan::with_discovered(&CascadeLayers::default(), &[]).rank_map();
        let step = 3; // maxIds 2
        let base = ranks["base"] * step;
        let utilities = ranks["utilities"] * step;
        let max_ids = 2;
        assert!(utilities > base + max_ids);
    }

    #[test]
    fn compact_suffix_has_one_not_with_n_ids() {
        let suffix = specificity_suffix_amount(4);
        assert!(suffix.starts_with(":not("));
        assert_eq!(suffix.matches("#\\#").count(), 4);
        assert_eq!(suffix.matches(":not(").count(), 1);
    }

    #[test]
    fn analyze_assigns_first_seen_utility_sublayer_rank() {
        let layers = CascadeLayers::default();
        let ops = [
            SheetOp::LayerEnter(layers.utilities.clone()),
            SheetOp::LayerEnter("compositions".into()),
            SheetOp::Rule {
                selector: ".x".into(),
                decls: vec![],
            },
            SheetOp::LayerExit,
            SheetOp::LayerExit,
        ];
        let result = analyze(&ops, &layers);
        let util = result.ranks[&layers.utilities];
        let comp = result.ranks["utilities.compositions"];
        assert!(comp < util);
    }

    // --- insertion point edge cases ---

    #[test]
    fn adjust_inserts_before_sibling_combinator() {
        assert_eq!(adjust_selector_specificity("a ~ b", 1), "a:not(#\\#) ~ b");
    }

    #[test]
    fn adjust_inserts_before_adjacent_sibling_combinator() {
        assert_eq!(adjust_selector_specificity("a + b", 1), "a:not(#\\#) + b");
    }

    #[test]
    fn adjust_treats_newline_as_descendant_combinator() {
        assert_eq!(adjust_selector_specificity("a\n  b", 1), "a:not(#\\#)\n  b");
    }

    #[test]
    fn adjust_handles_multiple_combinators() {
        assert_eq!(
            adjust_selector_specificity("a > b ~ c", 1),
            "a:not(#\\#) > b ~ c"
        );
    }

    #[test]
    fn adjust_does_not_split_inside_functional_pseudo_class() {
        // `:not(.a, .b)`'s inner comma must not be treated as a selector-list separator.
        assert_eq!(
            adjust_selector_specificity(":not(.a, .b)", 1),
            ":not(.a, .b):not(#\\#)"
        );
    }

    #[test]
    fn adjust_stops_before_combinator_inside_has() {
        // The combinator inside `:has(> .a)` is nested — insertion must land
        // at the top-level combinator, not inside the functional pseudo-class.
        assert_eq!(
            adjust_selector_specificity(".x:has(> .a) .y", 1),
            ".x:has(> .a):not(#\\#) .y"
        );
    }

    #[test]
    fn adjust_handles_double_colon_placeholder_pseudo_element() {
        assert_eq!(
            adjust_selector_specificity("input::placeholder", 1),
            "input:not(#\\#)::placeholder"
        );
    }

    #[test]
    fn adjust_handles_legacy_single_colon_after_pseudo_element() {
        assert_eq!(
            adjust_selector_specificity("p:after", 1),
            "p:not(#\\#):after"
        );
    }

    #[test]
    fn adjust_does_not_treat_before_as_pseudo_element_mid_word() {
        // `:beforehand` isn't the `:before` pseudo-element — no early stop.
        assert_eq!(
            adjust_selector_specificity(".beforehand", 1),
            ".beforehand:not(#\\#)"
        );
    }

    #[test]
    fn adjust_three_way_selector_list() {
        assert_eq!(
            adjust_selector_specificity("a, b, c", 1),
            "a:not(#\\#), b:not(#\\#), c:not(#\\#)"
        );
    }

    #[test]
    fn adjust_selector_list_with_quoted_comma_in_attribute() {
        // A comma inside an attribute value string must not split the list.
        assert_eq!(
            adjust_selector_specificity(r#"[data-x="a,b"], .y"#, 1),
            r#"[data-x="a,b"]:not(#\#), .y:not(#\#)"#
        );
    }

    #[test]
    fn adjust_handles_unicode_class_name() {
        // Multi-byte identifiers must not panic byte-slicing at a non-boundary.
        assert_eq!(
            adjust_selector_specificity(".日本語 .café", 1),
            ".日本語:not(#\\#) .café"
        );
    }

    #[test]
    fn adjust_empty_selector_is_identity() {
        assert_eq!(adjust_selector_specificity("", 3), "");
    }

    #[test]
    fn adjust_whitespace_only_selector_is_unchanged() {
        assert_eq!(adjust_selector_specificity("   ", 1), "   ");
    }

    #[test]
    fn adjust_handles_universal_selector() {
        assert_eq!(adjust_selector_specificity("*", 1), "*:not(#\\#)");
    }

    #[test]
    fn adjust_preserves_leading_and_trailing_whitespace() {
        assert_eq!(adjust_selector_specificity("  .a  ", 1), "  .a:not(#\\#)  ");
    }

    // --- count_id_selectors edge cases ---

    #[test]
    fn count_ignores_hash_in_url_inside_attribute_value() {
        assert_eq!(
            count_id_selectors(r#"[href="/fonts/x.woff2#unlayered"]"#),
            0
        );
    }

    #[test]
    fn count_ignores_hash_in_single_quoted_attribute_value() {
        assert_eq!(count_id_selectors("[href='#foo']"), 0);
    }

    #[test]
    fn count_handles_escaped_id_selector() {
        // `#\31 a` is a valid (escaped-leading-digit) ID selector.
        assert_eq!(count_id_selectors(r"#\31 a"), 1);
    }

    #[test]
    fn count_ignores_bare_hash_not_followed_by_ident_char() {
        // A trailing `#` with nothing after it isn't a valid ID selector.
        assert_eq!(count_id_selectors("a#"), 0);
    }

    #[test]
    fn count_multiple_ids_in_one_compound_selector() {
        assert_eq!(count_id_selectors("#a#b#c"), 3);
    }

    #[test]
    fn count_ids_across_a_selector_list_takes_max_branch() {
        // Specificity A is per complex selector; lists take the max branch.
        assert_eq!(count_id_selectors("#a, .b, #c#d"), 2);
    }

    #[test]
    fn count_where_contributes_zero_even_with_ids() {
        assert_eq!(count_id_selectors(":where(#a #b)"), 0);
        assert_eq!(count_id_selectors(":where(#a #b) #c"), 1);
        assert_eq!(count_id_selectors("#x:where(#a, #b)"), 1);
    }

    #[test]
    fn count_is_not_has_take_max_argument_not_sum() {
        assert_eq!(count_id_selectors(":is(#a, #b)"), 1);
        assert_eq!(count_id_selectors(":not(#a, #b#c)"), 2);
        assert_eq!(count_id_selectors(":has(#a) #b"), 2);
        assert_eq!(count_id_selectors(":is(#a, :where(#b #c))"), 1);
        assert_eq!(count_id_selectors("#x:is(#a, #b)"), 2);
        assert_eq!(count_id_selectors(":matches(#a, .b)"), 1);
    }

    #[test]
    fn count_nested_functional_pseudos() {
        assert_eq!(count_id_selectors(":is(:not(#a), :where(#b #c), #d#e)"), 2);
        assert_eq!(count_id_selectors(":not(:is(#a, #b))"), 1);
    }

    #[test]
    fn count_ignores_hash_inside_nested_brackets() {
        assert_eq!(count_id_selectors("[data-x][href=#foo][data-y]"), 0);
    }

    #[test]
    fn count_counts_id_after_closing_bracket() {
        assert_eq!(count_id_selectors("[data-x]#real"), 1);
    }

    // --- escaped class names ---

    #[test]
    fn adjust_ignores_escaped_pseudo_element_in_class() {
        assert_eq!(
            adjust_selector_specificity(
                r".hover\:before\:opacity_0\.5:is(:hover, [data-hover])::before",
                1
            ),
            r".hover\:before\:opacity_0\.5:is(:hover, [data-hover]):not(#\#)::before"
        );
    }

    #[test]
    fn adjust_ignores_escaped_after_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\:after", 1),
            r".a\:after:not(#\#)"
        );
    }

    #[test]
    fn adjust_ignores_escaped_double_colon_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\:\:before", 1),
            r".a\:\:before:not(#\#)"
        );
    }

    #[test]
    fn adjust_ignores_escaped_quote_in_class() {
        assert_eq!(
            adjust_selector_specificity(r#".before\:content_\"\"::before"#, 1),
            r#".before\:content_\"\":not(#\#)::before"#
        );
    }

    #[test]
    fn adjust_ignores_escaped_single_quote_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\'b .c", 1),
            r".a\'b:not(#\#) .c"
        );
    }

    #[test]
    fn adjust_ignores_escaped_comma_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".animation_fadeIn_1s\,_slideUp_1s", 1),
            r".animation_fadeIn_1s\,_slideUp_1s:not(#\#)"
        );
    }

    #[test]
    fn adjust_splits_list_but_not_escaped_comma() {
        assert_eq!(
            adjust_selector_specificity(r".a\,b, .c", 1),
            r".a\,b:not(#\#), .c:not(#\#)"
        );
    }

    #[test]
    fn adjust_ignores_escaped_combinators_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".\[\&\>p\]\:mt_2 > p", 1),
            r".\[\&\>p\]\:mt_2:not(#\#) > p"
        );
    }

    #[test]
    fn adjust_ignores_escaped_plus_and_tilde_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\+b\~c", 1),
            r".a\+b\~c:not(#\#)"
        );
    }

    #[test]
    fn adjust_ignores_escaped_parens_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".w_calc\(100\%_-_2px\) .x", 1),
            r".w_calc\(100\%_-_2px\):not(#\#) .x"
        );
    }

    #[test]
    fn adjust_ignores_unbalanced_escaped_paren_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\( .b", 1),
            r".a\(:not(#\#) .b"
        );
    }

    #[test]
    fn adjust_ignores_unbalanced_escaped_bracket_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\[ .b", 1),
            r".a\[:not(#\#) .b"
        );
    }

    #[test]
    fn adjust_ignores_escaped_space_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\ b .c", 1),
            r".a\ b:not(#\#) .c"
        );
    }

    #[test]
    fn adjust_ignores_escaped_backslash_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".a\\ .b", 1),
            r".a\\:not(#\#) .b"
        );
    }

    #[test]
    fn adjust_handles_important_suffix_class() {
        assert_eq!(
            adjust_selector_specificity(r".c_red\!", 1),
            r".c_red\!:not(#\#)"
        );
    }

    #[test]
    fn adjust_handles_slash_and_percent_in_class() {
        assert_eq!(
            adjust_selector_specificity(r".bg_red\/50 .w_50\%", 1),
            r".bg_red\/50:not(#\#) .w_50\%"
        );
    }

    #[test]
    fn adjust_keeps_hex_escape_terminator_with_its_class() {
        assert_eq!(
            adjust_selector_specificity(r".\31 0 .b", 1),
            r".\31 0:not(#\#) .b"
        );
        assert_eq!(
            adjust_selector_specificity(r".\000031  p", 1),
            r".\000031 :not(#\#) p"
        );
    }

    #[test]
    fn adjust_handles_trailing_backslash() {
        assert_eq!(adjust_selector_specificity(r".a\", 1), r".a\:not(#\#)");
    }

    #[test]
    fn count_ignores_escaped_hash_in_class() {
        assert_eq!(count_id_selectors(r".c_\#f00"), 0);
        assert_eq!(count_id_selectors(r".c_\#FFFFFF4D .x"), 0);
    }

    #[test]
    fn count_ignores_hash_after_escaped_quote() {
        assert_eq!(count_id_selectors(r#".a\"b #c"#), 1);
    }

    #[test]
    fn count_ignores_escaped_comma_between_ids() {
        assert_eq!(count_id_selectors(r"#a\,#b"), 2);
        assert_eq!(count_id_selectors(r"#a, #b"), 1);
    }

    #[test]
    fn count_ignores_escaped_paren_before_where() {
        assert_eq!(count_id_selectors(r".a\(:where(#b)"), 0);
    }

    // --- specificity of functional pseudos ---

    #[test]
    fn count_host_and_host_context_arguments() {
        assert_eq!(count_id_selectors(":host(#a)"), 1);
        assert_eq!(count_id_selectors(":host-context(#a #b)"), 2);
        assert_eq!(count_id_selectors(":host"), 0);
    }

    #[test]
    fn count_slotted_argument() {
        assert_eq!(count_id_selectors("::slotted(#a)"), 1);
        assert_eq!(count_id_selectors(".x::slotted(.a)"), 0);
    }

    #[test]
    fn count_ignores_other_pseudo_element_arguments() {
        assert_eq!(count_id_selectors("::part(a)"), 0);
        assert_eq!(count_id_selectors("::view-transition-group(#a)"), 0);
    }

    #[test]
    fn count_nth_child_of_selector() {
        assert_eq!(count_id_selectors(":nth-child(2n+1 of #a)"), 1);
        assert_eq!(count_id_selectors(":nth-last-child(odd OF #a, #b#c)"), 2);
        assert_eq!(count_id_selectors(":nth-child(2n+1)"), 0);
    }

    #[test]
    fn count_ignores_nth_of_type_argument() {
        assert_eq!(count_id_selectors(":nth-of-type(2n+1)"), 0);
    }

    #[test]
    fn count_moz_any_argument_but_not_webkit_any() {
        assert_eq!(count_id_selectors(":-moz-any(#a, .b)"), 1);
        assert_eq!(count_id_selectors(":-webkit-any(#a, .b)"), 0);
        assert_eq!(count_id_selectors(":any(#a, .b)"), 0);
    }

    #[test]
    fn count_pseudo_names_case_insensitively() {
        assert_eq!(count_id_selectors(":IS(#a)"), 1);
        assert_eq!(count_id_selectors(":WHERE(#a)"), 0);
    }

    #[test]
    fn count_empty_pseudo_arguments() {
        assert_eq!(count_id_selectors(":is()"), 0);
        assert_eq!(count_id_selectors(":not()"), 0);
    }

    #[test]
    fn count_unclosed_pseudo_argument() {
        assert_eq!(count_id_selectors(":is(#a, #b#c"), 2);
    }

    #[test]
    fn count_ids_in_every_compound_of_complex_selector() {
        assert_eq!(count_id_selectors("#foo #bar target::before:hover"), 2);
    }

    #[test]
    fn count_polyfill_boost_itself() {
        assert_eq!(count_id_selectors(r".a:not(#\##\#)"), 2);
    }

    // --- selector list edge cases ---

    #[test]
    fn adjust_ignores_comma_inside_nested_parens() {
        assert_eq!(
            adjust_selector_specificity(":is(:where(.a, .b), .c), .d", 1),
            r":is(:where(.a, .b), .c):not(#\#), .d:not(#\#)"
        );
    }

    #[test]
    fn adjust_ignores_comma_inside_single_quoted_string() {
        assert_eq!(
            adjust_selector_specificity("[data-x='a,b'], .y", 1),
            r"[data-x='a,b']:not(#\#), .y:not(#\#)"
        );
    }

    #[test]
    fn adjust_skips_empty_trailing_branch() {
        assert_eq!(
            adjust_selector_specificity(".a,.b,", 1),
            r".a:not(#\#),.b:not(#\#),"
        );
    }

    // --- keyframes / non-selector-block at-rule detection ---

    #[test]
    fn keyframes_at_rule_is_detected_regardless_of_name() {
        assert!(is_non_selector_block_at_rule("@keyframes spin"));
        assert!(is_non_selector_block_at_rule("@keyframes fade-out"));
    }

    #[test]
    fn media_at_rule_is_not_a_non_selector_block() {
        assert!(!is_non_selector_block_at_rule("@media screen"));
        assert!(!is_non_selector_block_at_rule("@supports (display: grid)"));
    }
}
