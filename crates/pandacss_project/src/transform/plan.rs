//! Transform planning: match sites, bailouts, and rewrite decisions.

use pandacss_extractor::{ExtractUsage, ExtractedCall, MatchCategory};
use rustc_hash::FxHashSet;

use crate::PatternTransformFn;
use crate::Project;

use super::resolve;

#[derive(Debug, Clone, Default)]
pub struct TransformHelperFacts {
    pub needs_cx: bool,
    pub needs_cva: bool,
    pub needs_sva: bool,
}

impl TransformHelperFacts {
    pub(crate) fn merge(&mut self, other: &Self) {
        self.needs_cx |= other.needs_cx;
        self.needs_cva |= other.needs_cva;
        self.needs_sva |= other.needs_sva;
    }

    /// Content that calls no internal runtime symbol.
    pub(crate) const fn none() -> Self {
        Self {
            needs_cx: false,
            needs_cva: false,
            needs_sva: false,
        }
    }

    pub(crate) const fn cx() -> Self {
        Self {
            needs_cx: true,
            needs_cva: false,
            needs_sva: false,
        }
    }

    pub(crate) const fn cva() -> Self {
        Self {
            needs_cx: false,
            needs_cva: true,
            needs_sva: false,
        }
    }

    pub(crate) const fn sva() -> Self {
        Self {
            needs_cx: false,
            needs_cva: false,
            needs_sva: true,
        }
    }
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

impl TransformPlan {
    fn push(&mut self, rewrite: Rewrite) {
        self.rewrites.push(rewrite);
    }

    fn extend(&mut self, rewrites: impl IntoIterator<Item = Rewrite>) {
        self.rewrites.extend(rewrites);
    }

    /// Drops rewrites overlapping an earlier, wider one — `MagicString`
    /// silently discards overlapping edits, so a nested site has to stay as-is
    /// inside the outer rewrite's output — then derives helper demand from the
    /// rewrites that survived. A dropped rewrite's symbols are never emitted.
    fn settle(&mut self) {
        self.rewrites
            .sort_by(|a, b| a.start.cmp(&b.start).then(b.end.cmp(&a.end)));
        let mut covered_end = 0;
        self.rewrites.retain(|rewrite| {
            let kept = rewrite.start >= covered_end;
            if kept {
                covered_end = rewrite.end;
            }
            kept
        });

        let mut helper = TransformHelperFacts::none();
        for rewrite in &self.rewrites {
            helper.merge(&rewrite.helper);
        }
        self.helper = helper;
    }
}

#[derive(Debug, Clone)]
pub(crate) struct Rewrite {
    pub start: u32,
    pub end: u32,
    pub content: String,
    /// Original source regions deliberately re-emitted by this rewrite.
    pub preserved: Vec<pandacss_shared::Span>,
    /// Internal runtime symbols this rewrite's content calls. Declared by the
    /// producer — `content` re-emits user source, so it can't be scanned for
    /// them. Deliberately has no `Default`: a new producer must state its
    /// demand or fail to compile.
    pub helper: TransformHelperFacts,
}

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

    // An imported recipe's definition file precomputes its class strings, so
    // its runtime `raw` would hand back a string — pin the styles here instead.
    for raw_call in &extracted.imported_recipe_raw_calls {
        if let Some(rewrite) =
            resolve::rewrite_for_style_literal(source, raw_call.span, &raw_call.styles)
        {
            plan.push(rewrite);
        }
    }

    for call in &extracted.calls {
        // `.raw()` returns a style object, never a class string. Rewriting it
        // to classes hands composition sites a string where they expect styles.
        // Where `.raw` is an identity the wrapper can still go; the rest stay.
        if call.facts.raw {
            push_raw_rewrites(
                &mut plan,
                project,
                source,
                call,
                targets,
                pattern_transform.as_deref_mut(),
            );
            continue;
        }
        match call.category {
            MatchCategory::Css if targets.css_enabled() => {
                push_css_call_rewrites(
                    &mut plan,
                    project,
                    source,
                    extracted,
                    call,
                    options.helper_cx,
                );
            }
            MatchCategory::Recipe if targets.recipes_enabled() => {
                if let Some(rewrite) = resolve::rewrite_for_recipe_call(
                    project,
                    source,
                    &call.name,
                    call.span,
                    &call.data,
                    &call.style_args,
                    &call.facts,
                ) {
                    plan.push(rewrite);
                }
            }
            MatchCategory::Pattern if targets.patterns_enabled() => {
                if let Some(rewrite) = resolve::rewrite_for_pattern_call(
                    project,
                    &call.name,
                    call.span,
                    &call.data,
                    &call.style_args,
                    &call.facts,
                    pattern_transform.as_deref_mut(),
                ) {
                    plan.push(rewrite);
                }
            }
            MatchCategory::Jsx if targets.jsx_enabled() => {
                if let Some(rewrite) =
                    super::recipe_inline::rewrite_for_styled_call(project, source, call)
                {
                    plan.push(rewrite);
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
                pattern_transform.as_deref_mut(),
            );
            plan.extend(rewrites);
        }
    }

    if targets.tokens_enabled() {
        push_token_rewrites(&mut plan, extracted);
    }

    plan.settle();
    plan
}

/// Dispatch one `css`-entrypoint call: the inline recipe factories, the
/// `viewTransition` helper, or a plain `css()`.
fn push_css_call_rewrites(
    plan: &mut TransformPlan,
    project: &Project,
    source: &str,
    extracted: &ExtractUsage,
    call: &ExtractedCall,
    helper_cx: HelperCxMode,
) {
    match call.name.as_str() {
        "cva" | "sva"
            if !push_inline_recipe_raw_rewrites(plan, project, source, extracted, call) => {}
        "cva" => {
            if let Some(rewrite) = super::recipe_inline::rewrite_for_cva_call(
                project,
                source,
                call.span,
                &call.data,
                &call.arg_spans,
                &call.style_args,
            ) {
                // Keep call sites as `__pcva` runtime — boolean bitset
                // + memo beats `__pcx(cond && slot)` when prop tuples
                // reuse (css-in-js-bench btn-variant). Call-site
                // lowering must stay opt-in, never the default.
                plan.push(rewrite);
            }
        }
        "sva" => {
            if let Some(rewrite) =
                super::recipe_inline::rewrite_for_sva_call(project, call.span, &call.data)
            {
                plan.push(rewrite);
            }
        }
        "viewTransition" => {
            match resolve::rewrite_for_view_transition_call(project, call.span, &call.data) {
                Some(rewrite) => plan.push(rewrite),
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
            helper_cx,
        ) {
            Some(rewrite) => plan.push(rewrite),
            None if css_style_tree_should_bail(&call.style_args) => plan.bailed = true,
            None if resolve::css_call_should_bail(&call.data) => plan.bailed = true,
            None => {}
        },
    }
}

/// Fold `binding.raw(props)` for an inline `cva`/`sva` definition, and report
/// whether the definition may still be desugared to string branches.
///
/// The desugared runtime's `raw` returns class strings where the real one
/// returns style objects, so a `.raw` call this can't fold has to keep the
/// original runtime.
fn push_inline_recipe_raw_rewrites(
    plan: &mut TransformPlan,
    project: &Project,
    source: &str,
    extracted: &ExtractUsage,
    call: &ExtractedCall,
) -> bool {
    let Some(binding) = extracted
        .module
        .local_call_bindings
        .iter()
        .find(|binding| binding.init_span == call.span)
    else {
        return true;
    };
    // A `.raw` that escapes as a value can't be folded, and the desugared
    // runtime would hand it back a class string.
    if binding.has_opaque_raw_access {
        return false;
    }
    if binding.raw_calls.is_empty() {
        return true;
    }
    let Some(config) = call.data.first().and_then(|arg| arg.as_ref()) else {
        return false;
    };

    let mut rewrites = Vec::with_capacity(binding.raw_calls.len());
    for raw_call in &binding.raw_calls {
        let Some(props) = super::recipe_inline::raw_call_variant_props(source, &raw_call.args)
        else {
            return false;
        };
        let Some(styles) =
            super::recipe_inline::resolve_inline_recipe_raw(project, &call.name, config, &props)
        else {
            return false;
        };
        let Some(rewrite) = resolve::rewrite_for_style_literal(source, raw_call.span, &styles)
        else {
            return false;
        };
        rewrites.push(rewrite);
    }
    plan.extend(rewrites);
    true
}

/// Fold a `.raw()` call to the style object it evaluates to.
///
/// `css.raw(o)` is `mergeCss(o)`, which skips normalization for a single
/// object, and `recipe.raw` is `props => props` — both unwrap to their
/// argument, edited around it so nested rewrites still apply. `css.raw(a, b)`
/// normalizes and deep-merges, and `pattern.raw(props)` runs the pattern
/// transform, so both are replaced by the computed object.
fn push_raw_rewrites(
    plan: &mut TransformPlan,
    project: &Project,
    source: &str,
    call: &ExtractedCall,
    targets: &TransformTargets,
    pattern_transform: Option<&mut PatternTransformFn<'_>>,
) {
    match call.category {
        MatchCategory::Pattern if targets.patterns_enabled() => {
            if let Some(rewrite) =
                resolve::rewrite_for_pattern_raw_call(project, source, call, pattern_transform)
            {
                plan.push(rewrite);
            }
        }
        MatchCategory::Css if targets.css_enabled() && call.name == "css" => {
            push_identity_or_merged_raw(plan, project, source, call);
        }
        MatchCategory::Recipe if targets.recipes_enabled() => {
            if let Some(rewrites) = resolve::rewrites_for_identity_raw_call(
                source,
                call.span,
                &call.arg_spans,
                &call.facts,
            ) {
                plan.extend(rewrites);
            }
        }
        _ => {}
    }
}

fn push_identity_or_merged_raw(
    plan: &mut TransformPlan,
    project: &Project,
    source: &str,
    call: &ExtractedCall,
) {
    if let Some(rewrites) =
        resolve::rewrites_for_identity_raw_call(source, call.span, &call.arg_spans, &call.facts)
    {
        plan.extend(rewrites);
    } else if let Some(rewrite) =
        resolve::rewrite_for_merged_raw_call(project, source, call.span, &call.data)
    {
        plan.push(rewrite);
    }
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
    let mut seen: FxHashSet<u32> = FxHashSet::default();
    // Buffered so the claim check reads the pre-token rewrites only.
    let mut token_rewrites = Vec::new();

    for token_ref in &extracted.token_refs {
        let (start, end) = (token_ref.span.start, token_ref.span.end);
        let Some(value) = token_ref.value.as_deref() else {
            continue;
        };
        let claimed = plan
            .rewrites
            .iter()
            .any(|rewrite| start >= rewrite.start && end <= rewrite.end);
        if claimed || !seen.insert(start) {
            continue;
        }
        token_rewrites.push(Rewrite {
            start,
            end,
            content: serde_json::to_string(value).expect("string serializes as JSON"),
            preserved: Vec::new(),
            helper: TransformHelperFacts::none(),
        });
    }

    plan.extend(token_rewrites);
}
