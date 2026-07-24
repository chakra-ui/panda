//! Transform planning: match sites, bailouts, and rewrite decisions.

use pandacss_extractor::{ExtractUsage, MatchCategory};

use crate::PatternTransformFn;
use crate::Project;

use super::helper::{CVA_HELPER_LOCAL, CX_HELPER_LOCAL};
use super::resolve;

#[derive(Debug, Clone, Default)]
pub struct TransformHelperFacts {
    pub needs_cx: bool,
    pub needs_cva: bool,
    pub needs_sva: bool,
}

#[derive(Debug, Clone, Default)]
pub struct TransformOutput {
    pub code: String,
    pub map: Option<String>,
    pub changed: bool,
    pub bailed: bool,
    pub diagnostics: Vec<pandacss_extractor::Diagnostic>,
    pub dependencies: Vec<String>,
    pub helper: TransformHelperFacts,
}

#[derive(Debug, Clone, Default)]
pub struct TransformOptions {
    pub mode: TransformMode,
    pub helper_cx: HelperCxMode,
    pub targets: TransformTargets,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum TransformMode {
    #[default]
    Build,
    Serve,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum HelperCxMode {
    #[default]
    Auto,
    True,
    False,
}

#[derive(Debug, Clone, Default)]
#[allow(
    clippy::struct_excessive_bools,
    reason = "mirrors NAPI transform target flags"
)]
pub struct TransformTargets {
    pub css: bool,
    pub patterns: bool,
    pub recipes: bool,
    pub tokens: bool,
    pub jsx: bool,
}

impl TransformTargets {
    #[must_use]
    pub fn css_enabled(&self) -> bool {
        self.css || self.is_empty()
    }

    #[must_use]
    pub fn patterns_enabled(&self) -> bool {
        self.patterns || self.is_empty()
    }

    #[must_use]
    pub fn recipes_enabled(&self) -> bool {
        self.recipes || self.is_empty()
    }

    #[must_use]
    pub fn jsx_enabled(&self) -> bool {
        self.jsx || self.is_empty()
    }

    #[must_use]
    pub fn tokens_enabled(&self) -> bool {
        self.tokens || self.is_empty()
    }

    fn is_empty(&self) -> bool {
        !self.css && !self.patterns && !self.recipes && !self.tokens && !self.jsx
    }
}

#[derive(Debug, Clone)]
pub(crate) struct TransformPlan {
    pub rewrites: Vec<Rewrite>,
    pub dependencies: Vec<String>,
    pub helper: TransformHelperFacts,
    pub module: pandacss_extractor::ModuleFacts,
    pub bailed: bool,
}

#[derive(Debug, Clone)]
pub(crate) struct Rewrite {
    pub start: u32,
    pub end: u32,
    pub content: String,
    /// Original source regions deliberately re-emitted by this rewrite.
    pub preserved: Vec<pandacss_shared::Span>,
}

#[allow(
    clippy::too_many_lines,
    reason = "single dispatch over every matched call/jsx/token kind"
)]
pub(crate) fn build_plan(
    project: &Project,
    source: &str,
    extracted: &ExtractUsage,
    options: &TransformOptions,
    mut pattern_transform: Option<&mut PatternTransformFn<'_>>,
) -> TransformPlan {
    let mut plan = TransformPlan {
        rewrites: Vec::new(),
        // Reported so the host re-transforms this file when a cross-file
        // module read to fold an imported value changes.
        dependencies: extracted.dependencies.clone(),
        helper: TransformHelperFacts::default(),
        module: extracted.module.clone(),
        bailed: false,
    };

    let targets = &options.targets;
    if !targets.css_enabled()
        && !targets.patterns_enabled()
        && !targets.recipes_enabled()
        && !targets.jsx_enabled()
        && !targets.tokens_enabled()
    {
        return plan;
    }

    for call in &extracted.calls {
        match call.category {
            MatchCategory::Css if targets.css_enabled() => match call.name.as_str() {
                "cva" => {
                    if call.facts.raw {
                        continue;
                    }
                    if let Some(rewrite) = super::recipe_inline::rewrite_for_cva_call(
                        project,
                        source,
                        call.span,
                        &call.data,
                        &call.arg_spans,
                        &call.style_args,
                    ) {
                        plan.rewrites.push(rewrite);
                        plan.helper.needs_cva = true;
                    }
                }
                "sva" => {
                    if call.facts.raw {
                        continue;
                    }
                    if let Some(rewrite) =
                        super::recipe_inline::rewrite_for_sva_call(project, call.span, &call.data)
                    {
                        plan.rewrites.push(rewrite);
                        plan.helper.needs_sva = true;
                    }
                }
                "viewTransition" => {
                    if call.facts.raw {
                        continue;
                    }
                    match resolve::rewrite_for_view_transition_call(project, call.span, &call.data)
                    {
                        Some(rewrite) => plan.rewrites.push(rewrite),
                        None if call.data.first().is_some_and(Option::is_none) => {
                            plan.bailed = true;
                        }
                        None => {}
                    }
                }
                _ => match resolve::rewrite_for_css_call(
                    project,
                    source,
                    call.span,
                    &call.data,
                    &call.style_args,
                    &call.facts,
                    options.helper_cx,
                ) {
                    Some(rewrite) => {
                        plan.helper.needs_cx |= rewrite.content.contains(CX_HELPER_LOCAL);
                        plan.rewrites.push(rewrite);
                    }
                    None if css_style_tree_should_bail(&call.style_args) => plan.bailed = true,
                    None if resolve::css_call_should_bail(&call.data) => plan.bailed = true,
                    None => {}
                },
            },
            MatchCategory::Recipe if targets.recipes_enabled() => {
                if let Some(rewrite) = resolve::rewrite_for_recipe_call(
                    project,
                    &call.name,
                    call.span,
                    &call.data,
                    &call.facts,
                ) {
                    plan.rewrites.push(rewrite);
                }
            }
            MatchCategory::Pattern if targets.patterns_enabled() => {
                if let Some(rewrite) = resolve::rewrite_for_pattern_call(
                    project,
                    &call.name,
                    call.span,
                    &call.data,
                    &call.facts,
                    pattern_transform.as_deref_mut(),
                ) {
                    plan.rewrites.push(rewrite);
                }
            }
            MatchCategory::Jsx if targets.jsx_enabled() => {
                if let Some(rewrite) =
                    super::recipe_inline::rewrite_for_styled_call(project, source, call)
                {
                    plan.rewrites.push(rewrite);
                    plan.helper.needs_cva = true;
                }
            }
            _ => {}
        }
    }

    if targets.jsx_enabled() {
        for jsx in &extracted.jsx {
            let rewrites = super::jsx::rewrites_for_jsx_element(
                project,
                source,
                jsx,
                options.helper_cx,
                &mut plan.helper.needs_cx,
                pattern_transform.as_deref_mut(),
            );
            for rewrite in &rewrites {
                plan.helper.needs_cva |= rewrite.content.contains(CVA_HELPER_LOCAL);
            }
            plan.rewrites.extend(rewrites);
        }
    }

    if targets.tokens_enabled() {
        push_token_rewrites(&mut plan, extracted);
    }

    plan
}

fn css_style_tree_should_bail(style_args: &[Option<pandacss_extractor::StyleTree>]) -> bool {
    let Some(tree) = style_args.first().and_then(|value| value.as_ref()) else {
        return false;
    };
    tree.is_open()
        || super::style_lower::style_tree_has_rewrite_sites(tree)
        || super::style_lower::style_tree_has_open_spread(tree)
        || super::style_lower::style_tree_has_open_value(tree)
}

/// Inlines standalone `token()`/`token.var()` calls to their resolved value.
/// Skips calls already covered by another rewrite (e.g. inside a rewritten
/// `css()`), and calls that don't resolve.
fn push_token_rewrites(plan: &mut TransformPlan, extracted: &ExtractUsage) {
    let claimed: Vec<(u32, u32)> = plan.rewrites.iter().map(|r| (r.start, r.end)).collect();
    let mut seen: Vec<u32> = Vec::new();

    for token_ref in &extracted.token_refs {
        let (start, end) = (token_ref.span.start, token_ref.span.end);
        let Some(value) = token_ref.value.as_deref() else {
            continue;
        };
        if claimed.iter().any(|(s, e)| start >= *s && end <= *e) || seen.contains(&start) {
            continue;
        }
        seen.push(start);
        plan.rewrites.push(Rewrite {
            start,
            end,
            content: serde_json::to_string(value).expect("string serializes as JSON"),
            preserved: Vec::new(),
        });
    }
}
