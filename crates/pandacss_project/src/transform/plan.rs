//! Transform planning: match sites, bailouts, and rewrite decisions.

use pandacss_extractor::{ExtractUsage, MatchCategory};

use crate::PatternTransformFn;
use crate::Project;

use super::helper::CX_HELPER_LOCAL;
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
    pub bailed: bool,
}

#[derive(Debug, Clone)]
pub(crate) struct Rewrite {
    pub start: u32,
    pub end: u32,
    pub content: String,
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
        dependencies: Vec::new(),
        helper: TransformHelperFacts::default(),
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
                    if resolve::call_is_raw_member(source, call.span) {
                        continue;
                    }
                    if let Some(rewrite) =
                        super::recipe_inline::rewrite_for_cva_call(project, call.span, &call.data)
                    {
                        plan.rewrites.push(rewrite);
                        plan.helper.needs_cva = true;
                    }
                }
                "sva" => {
                    if resolve::call_is_raw_member(source, call.span) {
                        continue;
                    }
                    if let Some(rewrite) =
                        super::recipe_inline::rewrite_for_sva_call(project, call.span, &call.data)
                    {
                        plan.rewrites.push(rewrite);
                        plan.helper.needs_sva = true;
                    }
                }
                _ => match resolve::rewrite_for_css_call(
                    project,
                    source,
                    call.span,
                    &call.data,
                    &call.arg_spans,
                    options.helper_cx,
                ) {
                    Some(rewrite) => {
                        plan.helper.needs_cx |= rewrite.content.contains(CX_HELPER_LOCAL);
                        plan.rewrites.push(rewrite);
                    }
                    None if super::css_conditional::args_need_conditional_rewrite(
                        source,
                        &call.arg_spans,
                        &call.data,
                    ) =>
                    {
                        plan.bailed = true;
                    }
                    None if resolve::css_call_should_bail(&call.data) => plan.bailed = true,
                    None => {}
                },
            },
            MatchCategory::Recipe if targets.recipes_enabled() => {
                if let Some(rewrite) = resolve::rewrite_for_recipe_call(
                    project, source, &call.name, call.span, &call.data,
                ) {
                    plan.rewrites.push(rewrite);
                }
            }
            MatchCategory::Pattern if targets.patterns_enabled() => {
                if let Some(rewrite) = resolve::rewrite_for_pattern_call(
                    project,
                    source,
                    &call.name,
                    call.span,
                    &call.data,
                    pattern_transform.as_deref_mut(),
                ) {
                    plan.rewrites.push(rewrite);
                }
            }
            MatchCategory::Jsx if targets.jsx_enabled() => {
                if let Some(rewrite) = super::recipe_inline::rewrite_for_styled_call(project, call)
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
            plan.rewrites.extend(super::jsx::rewrites_for_jsx_element(
                project,
                source,
                jsx,
                options.helper_cx,
                &mut plan.helper.needs_cx,
                pattern_transform.as_deref_mut(),
            ));
        }
    }

    if targets.tokens_enabled() {
        push_token_rewrites(&mut plan, extracted);
    }

    plan
}

/// Inline standalone `token()` / `token.var()` calls to their resolved value.
/// Skips calls nested inside a rewrite that already inlines them (e.g. a
/// rewritten `css()`), and calls that don't resolve.
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
        });
    }
}
