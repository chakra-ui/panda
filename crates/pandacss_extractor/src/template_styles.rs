//! Framework-template style-prop extraction.
//!
//! This complements the expression adapter: Vue/Svelte template attrs like
//! `<Box color="red" />` are not JS expressions, so they are collected
//! directly into the same `ExtractedJsx` shape the JSX visitor emits.

use crate::adapter::{AdaptedSource, SfcFormat};
use crate::dynamic_values::{self, DynamicStyleValue, DynamicStyleValueKind};
use crate::{
    ExtractedJsx, ExtractorConfig, ImportSpecifierKind, JsxTagAction, Literal, MatchCategory,
    MatchedImport, Span,
    jsx::{merge_style_prop, merge_style_props},
    literal::expression_to_literal,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{BindingPattern, Expression, Program, Statement, VariableDeclaration};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use pandacss_sfc::js::find_closing_brace as find_matching_brace;
use pandacss_sfc::markup::{
    Expressions, MarkupWalker, blank_like, copy_range, find_bytes, finish_mask, starts_with,
};
use pandacss_sfc::{TemplateAttributeValue, TemplateElement};
use rustc_hash::FxHashMap;
use std::borrow::Cow;
use std::cell::RefCell;

#[derive(Clone, Copy)]
enum Framework {
    Vue,
    Svelte,
}

struct ResolvedTemplateTag<'a> {
    category: MatchCategory,
    name: Cow<'a, str>,
    alias: Cow<'a, str>,
    /// Mirrors `ResolvedTag::emit_empty`: a matched Panda import or
    /// configured component name emits even with no extractable attrs, so a
    /// bare `<Custom.Root>` still renders its recipe's base + defaults.
    emit_empty: bool,
    /// Mirrors `ResolvedTag::panda_owned` — matched Panda import vs name-only.
    panda_owned: bool,
    /// Mirrors `ResolvedTag::props`.
    props: Option<&'a rustc_hash::FxHashSet<String>>,
}

#[must_use]
#[allow(
    clippy::too_many_arguments,
    reason = "mirrors the extraction context passed to every template collector"
)]
pub(crate) fn collect_template_styles(
    source: &str,
    adapted: &AdaptedSource<'_>,
    path: &str,
    matched: &[MatchedImport],
    config: &ExtractorConfig,
    program: &Program<'_>,
    resolver: &crate::Resolver<'_, '_>,
    retain_transform_facts: bool,
    dynamic_style_values: Option<&mut Vec<DynamicStyleValue>>,
) -> Vec<ExtractedJsx> {
    if !config.has_jsx_framework {
        return Vec::new();
    }
    // PERF(port): template extraction scans the full source and AST; only SFC formats need it.
    let Some(format) = adapted.format else {
        return Vec::new();
    };

    let context_source = match format {
        SfcFormat::Vue | SfcFormat::Svelte => {
            Cow::Owned(mask_script_blocks(source, &adapted.scripts))
        }
        SfcFormat::Astro | SfcFormat::Mdx => Cow::Borrowed(adapted.code.as_ref()),
    };
    let mut literal_index = TemplateLiteralIndex {
        resolver,
        format,
        source: adapted.code.as_ref(),
        last_container: None,
        ranges: MarkupRanges::new(template_markup_ranges(source, adapted)),
        literals: FxHashMap::default(),
        dynamic_containers: dynamic_style_values.is_some().then(FxHashMap::default),
    };
    literal_index.visit_program(program);
    let context = TemplateContext {
        source: context_source.as_ref(),
        format,
        raw_source: source,
        path,
        matched,
        config,
        cross_file: resolver.cross_file_context(),
        literals: literal_index.literals,
        dynamic_containers: literal_index.dynamic_containers.unwrap_or_default(),
        dynamic: dynamic_style_values.is_some().then(RefCell::default),
        retain_transform_facts,
    };
    let imports = if config.jsx.tag_rules_use_from() {
        crate::imports::collect_imports(program)
    } else {
        Vec::new()
    };
    let scan = TemplateScan {
        import_sources: crate::imports::import_sources(&imports),
        framework: match format {
            SfcFormat::Vue => Framework::Vue,
            SfcFormat::Svelte | SfcFormat::Astro | SfcFormat::Mdx => Framework::Svelte,
        },
        adapted,
        matched,
        config,
        context: &context,
    };
    let out = match format {
        SfcFormat::Vue => collect_vue_template_styles(source, &scan),
        SfcFormat::Svelte => collect_svelte_template_styles(source, &scan),
        SfcFormat::Astro | SfcFormat::Mdx => {
            collect_markup_template_styles(source, &adapted.template_elements, &scan)
        }
    };
    if let (Some(out), Some(collected)) = (dynamic_style_values, context.dynamic) {
        out.append(&mut collected.into_inner());
    }
    out
}

fn mask_script_blocks(source: &str, scripts: &[pandacss_sfc::markup::TagBlock]) -> String {
    let mut mask = blank_like(source);
    for block in scripts {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }
    finish_mask(mask)
}

struct TemplateContext<'a> {
    format: SfcFormat,
    source: &'a str,
    raw_source: &'a str,
    path: &'a str,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
    cross_file: Option<&'a crate::cross_file::CrossFileContext<'a>>,
    literals: FxHashMap<(u32, u32), Literal>,
    dynamic_containers: FxHashMap<(u32, u32), Vec<DynamicStyleValue>>,
    dynamic: Option<RefCell<Vec<DynamicStyleValue>>>,
    retain_transform_facts: bool,
}

impl TemplateContext<'_> {
    fn dynamic_len(&self) -> usize {
        self.dynamic
            .as_ref()
            .map_or(0, |dynamic| dynamic.borrow().len())
    }

    fn settle_dynamic(&self, resolved: &ResolvedTemplateTag<'_>, before: usize) {
        let Some(dynamic) = &self.dynamic else {
            return;
        };
        let mut dynamic = dynamic.borrow_mut();
        let kind = crate::jsx::jsx_kind(&self.config.matchers, &resolved.name, &resolved.alias);
        if !dynamic_values::reports_jsx_tag(kind, resolved.panda_owned, resolved.emit_empty) {
            dynamic.truncate(before);
            return;
        }
        if let Some(props) = resolved.props {
            let added = dynamic.split_off(before);
            dynamic.extend(
                added
                    .into_iter()
                    .filter(|value| value.path.first().is_some_and(|key| props.contains(key))),
            );
        }
    }

    fn record_dynamic_attr(
        &self,
        tag_name: &str,
        name: &str,
        value: AttrValue<'_>,
        literal: Option<&Literal>,
    ) {
        let Some(dynamic) = &self.dynamic else {
            return;
        };
        let (AttrValue::Static(expression) | AttrValue::Expr(expression)) = value else {
            return;
        };
        if !self.config.jsx.should_extract_prop(tag_name, name) {
            return;
        }
        let Some(span) = source_span(self.raw_source, expression) else {
            return;
        };
        let mut dynamic = dynamic.borrow_mut();
        if let Some(members) = self.dynamic_containers.get(&(span.start, span.end)) {
            dynamic.extend(members.iter().map(|member| {
                DynamicStyleValue {
                    kind: member.kind,
                    path: std::iter::once(name.to_owned())
                        .chain(member.path.iter().cloned())
                        .collect(),
                    span: member.span,
                }
            }));
        } else if literal.is_none() {
            dynamic.push(DynamicStyleValue {
                kind: DynamicStyleValueKind::Value,
                path: vec![name.to_owned()],
                span,
            });
        }
    }
}

struct TemplateLiteralIndex<'resolver, 'ast, 'callback> {
    resolver: &'resolver crate::Resolver<'ast, 'callback>,
    ranges: MarkupRanges,
    literals: FxHashMap<(u32, u32), Literal>,
    dynamic_containers: Option<FxHashMap<(u32, u32), Vec<DynamicStyleValue>>>,
    format: SfcFormat,
    source: &'resolver str,
    last_container: Option<usize>,
}

/// Ranges sorted by start with a running max of their ends, so a containment
/// query is one binary search even when Astro attribute ranges nest.
struct MarkupRanges {
    starts: Vec<u32>,
    max_ends: Vec<u32>,
}

impl MarkupRanges {
    fn new(mut ranges: Vec<(u32, u32)>) -> Self {
        ranges.sort_unstable();
        let mut max_end = 0;
        let (starts, max_ends) = ranges
            .into_iter()
            .map(|(start, end)| {
                max_end = max_end.max(end);
                (start, max_end)
            })
            .unzip();
        Self { starts, max_ends }
    }

    fn contains(&self, start: u32, end: u32) -> bool {
        let count = self
            .starts
            .partition_point(|&range_start| range_start <= start);
        count > 0 && self.max_ends[count - 1] >= end
    }
}

impl<'ast> Visit<'ast> for TemplateLiteralIndex<'_, 'ast, '_> {
    fn visit_expression(&mut self, expression: &Expression<'ast>) {
        let span = expression.span();
        if self.format == SfcFormat::Mdx {
            let count = self
                .ranges
                .starts
                .partition_point(|&start| start <= span.start);
            if count > 0
                && self.ranges.max_ends[count - 1] >= span.end
                && self.last_container != Some(count - 1)
            {
                self.last_container = Some(count - 1);
                let range = (
                    self.ranges.starts[count - 1],
                    self.ranges.max_ends[count - 1],
                );
                let mut lexer = pandacss_sfc::js::Lexer::new(
                    &self.source[..range.1 as usize],
                    span.end as usize,
                );
                if lexer.next_token(false).kind == pandacss_sfc::js::TokenKind::Eof {
                    self.record_dynamic_container(range, expression);
                    if let Some(literal) = expression_to_literal(expression, Some(self.resolver)) {
                        self.literals.insert(range, literal);
                    }
                }
            }
            walk::walk_expression(self, expression);
            return;
        }
        if self.ranges.contains(span.start, span.end) {
            self.record_dynamic_container((span.start, span.end), expression);
            if let Some(literal) = expression_to_literal(expression, Some(self.resolver)) {
                self.literals.insert((span.start, span.end), literal);
            }
        }
        walk::walk_expression(self, expression);
    }
}

impl TemplateLiteralIndex<'_, '_, '_> {
    fn record_dynamic_container(&mut self, range: (u32, u32), expression: &Expression<'_>) {
        let Some(containers) = self.dynamic_containers.as_mut() else {
            return;
        };
        if !matches!(
            expression.get_inner_expression(),
            Expression::ObjectExpression(_) | Expression::ArrayExpression(_)
        ) {
            return;
        }
        let mut members = Vec::new();
        dynamic_values::collect_literal_container(
            expression,
            Some(self.resolver),
            &mut Vec::new(),
            &mut members,
        );
        containers.insert(range, members);
    }
}

struct TemplateScan<'a> {
    import_sources: FxHashMap<&'a str, &'a str>,
    framework: Framework,
    adapted: &'a AdaptedSource<'a>,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
    context: &'a TemplateContext<'a>,
}

fn collect_vue_template_styles(source: &str, scan: &TemplateScan<'_>) -> Vec<ExtractedJsx> {
    let mut out = Vec::new();
    for block in &scan.adapted.templates {
        collect_markup_range(
            source,
            block.content_start,
            block.content_end,
            scan,
            &mut out,
        );
    }
    out
}

fn collect_svelte_template_styles(source: &str, scan: &TemplateScan<'_>) -> Vec<ExtractedJsx> {
    let scripts = &scan.adapted.scripts;
    let styles = &scan.adapted.styles;
    let mut excluded = Vec::with_capacity(scripts.len() + styles.len());
    excluded.extend(
        scripts
            .iter()
            .map(|block| (block.open_start, block.close_end)),
    );
    excluded.extend(
        styles
            .iter()
            .map(|block| (block.open_start, block.close_end)),
    );
    excluded.sort_unstable();

    let mut out = Vec::new();
    let mut cursor = 0;
    for (start, end) in excluded {
        if cursor < start {
            collect_markup_range(source, cursor, start, scan, &mut out);
        }
        cursor = end;
    }
    if cursor < source.len() {
        collect_markup_range(source, cursor, source.len(), scan, &mut out);
    }
    out
}

fn collect_markup_template_styles(
    source: &str,
    elements: &[TemplateElement],
    scan: &TemplateScan<'_>,
) -> Vec<ExtractedJsx> {
    let slice = |range: &std::ops::Range<u32>| source.get(range.start as usize..range.end as usize);
    let mut out = Vec::new();
    for element in elements {
        let Some(tag_name) = slice(&element.name) else {
            continue;
        };
        let Some(resolved) =
            resolve_template_tag(tag_name, scan.matched, scan.config, scan.framework)
        else {
            continue;
        };
        let dynamic_before = scan.context.dynamic_len();
        let mut entries = Vec::new();
        for attribute in &element.attributes {
            let value = match &attribute.value {
                TemplateAttributeValue::Spread(expression) => {
                    if let Some(expression) = slice(expression) {
                        merge_spread_with_context(
                            expression,
                            scan.config,
                            scan.context,
                            &resolved.name,
                            &mut entries,
                        );
                    }
                    continue;
                }
                TemplateAttributeValue::Empty => continue,
                TemplateAttributeValue::Boolean => AttrValue::Bool,
                TemplateAttributeValue::Static(value) => match slice(value) {
                    Some(value) => AttrValue::Static(value),
                    None => continue,
                },
                TemplateAttributeValue::Expression(expression) => match slice(expression) {
                    Some(expression) => AttrValue::Expr(expression),
                    None => continue,
                },
            };
            let Some(name) = attribute.name.as_ref().and_then(slice) else {
                continue;
            };
            if scan.context.format == SfcFormat::Mdx
                && let AttrValue::Static(raw) = value
            {
                let cooked = decode_mdx_attribute(raw);
                merge_svelte_attr(
                    name,
                    AttrValue::Static(&cooked),
                    scan.config,
                    scan.context,
                    &resolved.name,
                    &mut entries,
                );
                continue;
            }
            merge_attr(
                name,
                value,
                scan.framework,
                scan.config,
                scan.context,
                &resolved.name,
                &mut entries,
            );
        }
        scan.context.settle_dynamic(&resolved, dynamic_before);
        push_template_jsx(
            &mut out,
            scan,
            tag_name,
            resolved,
            entries,
            Span {
                start: element.opening.start,
                end: element.opening.end,
            },
        );
    }
    out
}

fn collect_markup_range(
    source: &str,
    start: usize,
    end: usize,
    scan: &TemplateScan<'_>,
    out: &mut Vec<ExtractedJsx>,
) {
    let bytes = source.as_bytes();
    let expressions = match scan.framework {
        Framework::Vue => Expressions::Interpolations,
        Framework::Svelte => Expressions::Braces,
    };
    let mut walker = MarkupWalker::new(source, expressions);
    let mut cursor = start;
    while cursor < end {
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(end, |index| index + 3);
            continue;
        }
        if bytes[cursor] == b'{'
            && let Some(expression_end) = walker.skip_expression(cursor)
        {
            cursor = expression_end;
            continue;
        }
        if bytes[cursor] == b'<' {
            match collect_tag(source, cursor, end, &mut walker, scan, out) {
                Tag::Collected(next) => {
                    cursor = next;
                    continue;
                }
                Tag::Text => {}
                // An unclosed quote or brace: the framework rejects the file.
                Tag::Unclosed => return,
            }
        }
        cursor += 1;
    }
}

enum Tag {
    Collected(usize),
    Text,
    Unclosed,
}

fn collect_tag(
    source: &str,
    tag_start: usize,
    limit: usize,
    walker: &mut MarkupWalker<'_>,
    scan: &TemplateScan<'_>,
    out: &mut Vec<ExtractedJsx>,
) -> Tag {
    let bytes = source.as_bytes();
    let Some(&first) = bytes.get(tag_start + 1) else {
        return Tag::Text;
    };
    if !first.is_ascii_alphabetic() {
        return Tag::Text;
    }
    let Some(tag_end) = walker
        .tag_end(tag_start + 1)
        .filter(|&tag_end| tag_end < limit)
    else {
        return Tag::Unclosed;
    };
    let name_start = tag_start + 1;
    let name_end = read_tag_name(bytes, name_start, tag_end);
    let Some(tag_name) = source
        .get(name_start..name_end)
        .filter(|name| !name.is_empty())
    else {
        return Tag::Collected(tag_end + 1);
    };
    let detected = resolve_template_tag(tag_name, scan.matched, scan.config, scan.framework);
    let Some(resolved) = apply_template_tag_rule(detected, tag_name, scan) else {
        return Tag::Collected(tag_end + 1);
    };

    let dynamic_before = scan.context.dynamic_len();
    let mut entries = Vec::new();
    collect_attrs(
        source,
        name_end,
        tag_end,
        scan,
        resolved.name.as_ref(),
        &mut entries,
    );
    if let Some(props) = resolved.props {
        entries.retain(|(key, _)| props.contains(key));
    }
    scan.context.settle_dynamic(&resolved, dynamic_before);

    push_template_jsx(
        out,
        scan,
        tag_name,
        resolved,
        entries,
        Span {
            start: u32::try_from(tag_start).unwrap_or(u32::MAX),
            end: u32::try_from(tag_end + 1).unwrap_or(u32::MAX),
        },
    );

    Tag::Collected(tag_end + 1)
}

fn push_template_jsx(
    out: &mut Vec<ExtractedJsx>,
    scan: &TemplateScan<'_>,
    tag_name: &str,
    resolved: ResolvedTemplateTag<'_>,
    entries: Vec<(String, Literal)>,
    tag_span: Span,
) {
    let mut data = Literal::Object(entries);
    if !resolved.panda_owned && !resolved.emit_empty {
        scan.config.jsx.retain_style_values(&mut data);
    }
    if matches!(&data, Literal::Object(entries) if entries.is_empty()) && !resolved.emit_empty {
        return;
    }
    let kind = crate::jsx::jsx_kind(&scan.config.matchers, &resolved.name, &resolved.alias);
    let retain = scan.context.retain_transform_facts;
    let style = retain.then(|| crate::style_tree::literal_to_style_tree(data.clone()));
    out.push(ExtractedJsx {
        category: resolved.category,
        kind,
        name: resolved.name.into_owned(),
        alias: resolved.alias.into_owned(),
        data,
        span: tag_span,
        closing_span: None,
        attributes: Vec::new(),
        panda_owned: resolved.panda_owned,
        style,
        source: if retain {
            crate::JsxSourceFacts {
                kind: crate::JsxSourceKind::FrameworkTemplate,
                factory_intrinsic: (kind == crate::JsxKind::Factory)
                    .then(|| tag_name.rsplit('.').next().map(str::to_owned))
                    .flatten(),
                ..Default::default()
            }
        } else {
            crate::JsxSourceFacts::default()
        },
    });
}

/// Mirrors `Extractor::apply_tag_rule`. Lowercase tags are elements, so rules skip them.
fn apply_template_tag_rule<'a>(
    detected: Option<ResolvedTemplateTag<'a>>,
    tag_name: &'a str,
    scan: &TemplateScan<'a>,
) -> Option<ResolvedTemplateTag<'a>> {
    let jsx = &scan.config.jsx;
    if jsx.tag_rules.is_empty() || !crate::matcher::is_uppercase_component_tag(tag_name) {
        return detected;
    }
    let root = tag_name.split_once('.').map_or(tag_name, |(root, _)| root);
    match jsx.tag_rule(tag_name, scan.import_sources.get(root).copied()) {
        None => detected,
        Some(JsxTagAction::Ignore) => None,
        Some(JsxTagAction::Include(props)) => {
            let mut resolved = detected.unwrap_or(ResolvedTemplateTag {
                category: MatchCategory::Jsx,
                name: Cow::Borrowed(tag_name),
                alias: Cow::Borrowed(tag_name),
                emit_empty: false,
                panda_owned: false,
                props: None,
            });
            resolved.props = props.as_deref();
            Some(resolved)
        }
    }
}

fn resolve_template_tag<'a>(
    tag_name: &'a str,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
    framework: Framework,
) -> Option<ResolvedTemplateTag<'a>> {
    let (root, path) = tag_name.split_once('.').unwrap_or((tag_name, ""));
    for item in matched {
        if item.category != MatchCategory::Jsx || item.alias != root {
            continue;
        }
        match item.kind {
            ImportSpecifierKind::Named if path.is_empty() => {
                if config
                    .matchers
                    .category_accepts_name(item.category, &item.name)
                {
                    return Some(ResolvedTemplateTag {
                        category: item.category,
                        name: Cow::Borrowed(&item.name),
                        alias: Cow::Borrowed(&item.alias),
                        emit_empty: true,
                        panda_owned: true,
                        props: None,
                    });
                }
            }
            ImportSpecifierKind::Namespace if !path.is_empty() => {
                let first = path.split('.').next()?;
                if config.matchers.category_accepts_name(item.category, first) {
                    return Some(ResolvedTemplateTag {
                        category: item.category,
                        name: Cow::Borrowed(path),
                        alias: Cow::Borrowed(&item.alias),
                        emit_empty: true,
                        panda_owned: true,
                        props: None,
                    });
                }
            }
            _ => {}
        }
    }

    if config
        .jsx
        .should_match_tag(tag_name, config.has_jsx_framework)
    {
        return Some(ResolvedTemplateTag {
            category: MatchCategory::Jsx,
            name: Cow::Borrowed(tag_name),
            alias: Cow::Borrowed(tag_name),
            emit_empty: config.jsx.is_component_tag(tag_name),
            panda_owned: false,
            props: None,
        });
    }

    // Vue resolves kebab-case tags against PascalCase bindings
    // (`<custom-root>` -> `CustomRoot`), same as configured component names.
    // Svelte components are always capitalized, so kebab tags there are
    // custom elements and stay unmatched.
    if matches!(framework, Framework::Vue) && tag_name.contains('-') {
        let pascal = pandacss_shared::pascal_case(tag_name);
        if config.jsx.is_component_tag(&pascal) {
            return Some(ResolvedTemplateTag {
                category: MatchCategory::Jsx,
                name: Cow::Owned(pascal),
                alias: Cow::Borrowed(tag_name),
                emit_empty: true,
                panda_owned: false,
                props: None,
            });
        }
    }
    None
}

fn collect_attrs(
    source: &str,
    start: usize,
    end: usize,
    scan: &TemplateScan<'_>,
    tag_name: &str,
    entries: &mut Vec<(String, Literal)>,
) {
    let bytes = source.as_bytes();
    let mut cursor = start;
    while cursor < end {
        skip_ws_and_tag_comments(bytes, &mut cursor, end);
        if cursor >= end || matches!(bytes[cursor], b'/' | b'>') {
            break;
        }

        if matches!(scan.framework, Framework::Svelte)
            && bytes[cursor] == b'{'
            && let Some(close) = find_matching_brace(&source[..end], cursor)
        {
            if let Some(expr) = svelte_spread_expr(source, cursor + 1, close) {
                merge_spread_with_context(expr, scan.config, scan.context, tag_name, entries);
            }
            cursor = close + 1;
            continue;
        }

        let name_start = cursor;
        cursor = read_attr_name(bytes, cursor, end, scan.framework);
        let Some(raw_name) = source.get(name_start..cursor) else {
            break;
        };
        skip_ws_and_tag_comments(bytes, &mut cursor, end);

        let value = if cursor < end && bytes[cursor] == b'=' {
            cursor += 1;
            skip_ws_and_tag_comments(bytes, &mut cursor, end);
            read_attr_value(source, &mut cursor, end, scan.framework)
        } else {
            AttrValue::Bool
        };

        merge_attr(
            raw_name,
            value,
            scan.framework,
            scan.config,
            scan.context,
            tag_name,
            entries,
        );
    }
}

#[derive(Clone, Copy)]
enum AttrValue<'a> {
    Bool,
    Static(&'a str),
    Expr(&'a str),
}

fn merge_attr(
    raw_name: &str,
    value: AttrValue<'_>,
    framework: Framework,
    config: &ExtractorConfig,
    context: &TemplateContext<'_>,
    tag_name: &str,
    entries: &mut Vec<(String, Literal)>,
) {
    match framework {
        Framework::Vue => merge_vue_attr(raw_name, value, config, context, tag_name, entries),
        Framework::Svelte => merge_svelte_attr(raw_name, value, config, context, tag_name, entries),
    }
}

fn merge_vue_attr(
    raw_name: &str,
    value: AttrValue<'_>,
    config: &ExtractorConfig,
    context: &TemplateContext<'_>,
    tag_name: &str,
    entries: &mut Vec<(String, Literal)>,
) {
    if raw_name == "v-bind" {
        if let AttrValue::Expr(expr) | AttrValue::Static(expr) = value {
            merge_spread_with_context(expr, config, context, tag_name, entries);
        }
        return;
    }

    let (name, is_expr) = if let Some(name) = raw_name.strip_prefix(':') {
        (name, true)
    } else if let Some(name) = raw_name.strip_prefix("v-bind:") {
        (name, true)
    } else if let Some(name) = raw_name.strip_prefix('.') {
        (name, true)
    } else if raw_name.starts_with("v-") || raw_name.starts_with('@') || raw_name.starts_with('#') {
        return;
    } else {
        (raw_name, false)
    };

    let name = strip_vue_modifiers(name);
    if name.starts_with('[') || is_template_transport_attr(name) {
        return;
    }
    // Vue 3.4 same-name shorthand: a valueless bound attr (`:size`) means
    // `:size="size"` with the arg camelized — resolve the identifier through
    // the script context instead of treating it as a boolean.
    let literal = if is_expr && matches!(value, AttrValue::Bool) {
        parse_expression_literal(&camelize(name), Some(context))
    } else {
        attr_literal(value, is_expr, context)
    };
    if is_expr {
        context.record_dynamic_attr(tag_name, name, value, literal.as_ref());
    }
    let Some(literal) = literal else {
        return;
    };
    merge_style_prop(entries, &config.jsx, tag_name, name, literal);
}

/// Vue's `camelize`: `foo-bar` -> `fooBar`.
fn camelize(name: &str) -> String {
    let mut out = pandacss_shared::pascal_case(name);
    if let Some(first) = out.get_mut(..1) {
        first.make_ascii_lowercase();
    }
    out
}

fn merge_svelte_attr(
    raw_name: &str,
    value: AttrValue<'_>,
    config: &ExtractorConfig,
    context: &TemplateContext<'_>,
    tag_name: &str,
    entries: &mut Vec<(String, Literal)>,
) {
    if raw_name.contains(':') || is_template_transport_attr(raw_name) {
        return;
    }
    let is_expr = matches!(value, AttrValue::Expr(_));
    let literal = attr_literal(value, is_expr, context);
    if is_expr {
        context.record_dynamic_attr(tag_name, raw_name, value, literal.as_ref());
    }
    let Some(literal) = literal else {
        return;
    };
    merge_style_prop(entries, &config.jsx, tag_name, raw_name, literal);
}

fn is_template_transport_attr(name: &str) -> bool {
    matches!(name, "class" | "className" | "id" | "style")
}

fn merge_spread_with_context(
    expr: &str,
    config: &ExtractorConfig,
    context: &TemplateContext<'_>,
    tag_name: &str,
    entries: &mut Vec<(String, Literal)>,
) {
    let Some(Literal::Object(items)) = parse_expression_literal(expr, Some(context)) else {
        return;
    };
    let items = items
        .into_iter()
        .filter(|(key, _)| !is_template_transport_attr(key))
        .collect();
    merge_style_props(entries, &config.jsx, tag_name, items);
}

fn attr_literal(
    value: AttrValue<'_>,
    is_expr: bool,
    context: &TemplateContext<'_>,
) -> Option<Literal> {
    match value {
        AttrValue::Bool => Some(Literal::Bool(true)),
        AttrValue::Static(value) if is_expr => parse_expression_literal(value, Some(context)),
        AttrValue::Static(value) => Some(Literal::String(value.to_owned())),
        AttrValue::Expr(value) => parse_expression_literal(value, Some(context)),
    }
}

fn parse_expression_literal(
    source: &str,
    context: Option<&TemplateContext<'_>>,
) -> Option<Literal> {
    if let Some(context) = context
        && context.format == SfcFormat::Mdx
    {
        let span = source_span(context.raw_source, source)?;
        return context.literals.get(&(span.start, span.end)).cloned();
    }
    if let Some(context) = context
        && let Some(span) = source_span(context.raw_source, source)
        && let Some(literal) = context.literals.get(&(span.start, span.end))
    {
        return Some(literal.clone());
    }

    let wrapped = if let Some(context) = context {
        format!("{}\n;const __p = ({source});", context.source)
    } else {
        format!("const __p = ({source});")
    };
    let allocator = Allocator::default();
    let parser_return = Parser::new(&allocator, &wrapped, SourceType::tsx()).parse();
    let resolver = context.map(|context| {
        crate::Resolver::build(crate::scope::ResolverBuildInput {
            program: &parser_return.program,
            matched: context.matched,
            matchers: Some(&context.config.matchers),
            tokens: context.config.token_dictionary.as_deref(),
            prefix: context.config.class_name_prefix.as_str(),
            cross_file: context.cross_file,
            source_path: Some(std::path::PathBuf::from(context.path)),
            line_index: None,
            pattern_raw_transform: None,
            recipe_raw_resolve: None,
        })
    });
    for stmt in parser_return.program.body.iter().rev() {
        let Statement::VariableDeclaration(var) = stmt else {
            continue;
        };
        if let Some(literal) = template_initializer_literal(var, resolver.as_ref()) {
            return Some(literal);
        }
    }
    None
}

fn template_markup_ranges(source: &str, adapted: &AdaptedSource<'_>) -> Vec<(u32, u32)> {
    let mut ranges = Vec::new();
    match adapted.format {
        Some(SfcFormat::Vue) => {
            for block in &adapted.templates {
                push_range(&mut ranges, block.content_start, block.content_end);
            }
        }
        Some(SfcFormat::Astro | SfcFormat::Mdx) => {
            for element in &adapted.template_elements {
                for attribute in &element.attributes {
                    if let TemplateAttributeValue::Expression(expression)
                    | TemplateAttributeValue::Spread(expression) = &attribute.value
                    {
                        ranges.push((expression.start, expression.end));
                    }
                }
            }
        }
        Some(SfcFormat::Svelte) | None => {
            let mut excluded: Vec<_> = adapted
                .scripts
                .iter()
                .chain(&adapted.styles)
                .map(|block| (block.open_start, block.close_end))
                .collect();
            excluded.sort_unstable();
            let mut cursor = 0;
            for (start, end) in excluded {
                if cursor < start {
                    push_range(&mut ranges, cursor, start);
                }
                cursor = cursor.max(end);
            }
            if cursor < source.len() {
                push_range(&mut ranges, cursor, source.len());
            }
        }
    }
    ranges
}

fn push_range(ranges: &mut Vec<(u32, u32)>, start: usize, end: usize) {
    if let (Ok(start), Ok(end)) = (u32::try_from(start), u32::try_from(end)) {
        ranges.push((start, end));
    }
}

fn source_span(full_source: &str, source: &str) -> Option<Span> {
    let full_start = full_source.as_ptr() as usize;
    let full_end = full_start.checked_add(full_source.len())?;
    let source_start = source.as_ptr() as usize;
    let source_end = source_start.checked_add(source.len())?;
    if source_start < full_start || source_end > full_end {
        return None;
    }
    Some(Span {
        start: u32::try_from(source_start - full_start).ok()?,
        end: u32::try_from(source_end - full_start).ok()?,
    })
}

fn template_initializer_literal(
    var: &VariableDeclaration<'_>,
    resolver: Option<&crate::Resolver<'_, '_>>,
) -> Option<Literal> {
    for declarator in &var.declarations {
        let BindingPattern::BindingIdentifier(id) = &declarator.id else {
            continue;
        };
        if id.name.as_str() != "__p" {
            continue;
        }
        let init = declarator.init.as_ref()?;
        return expression_to_literal(init, resolver);
    }
    None
}

fn read_attr_value<'a>(
    source: &'a str,
    cursor: &mut usize,
    end: usize,
    framework: Framework,
) -> AttrValue<'a> {
    let bytes = source.as_bytes();
    if *cursor >= end {
        return AttrValue::Bool;
    }
    if matches!(bytes[*cursor], b'\'' | b'"') {
        let quote = bytes[*cursor];
        *cursor += 1;
        let start = *cursor;
        while *cursor < end && bytes[*cursor] != quote {
            *cursor += 1;
        }
        let value = source.get(start..*cursor).unwrap_or_default();
        if *cursor < end {
            *cursor += 1;
        }
        return AttrValue::Static(value);
    }
    if matches!(framework, Framework::Svelte)
        && bytes[*cursor] == b'{'
        && let Some(close) = find_matching_brace(&source[..end], *cursor)
    {
        let value = source.get(*cursor + 1..close).unwrap_or_default();
        *cursor = close + 1;
        return AttrValue::Expr(value);
    }

    let start = *cursor;
    while *cursor < end && !bytes[*cursor].is_ascii_whitespace() && !matches!(bytes[*cursor], b'>')
    {
        *cursor += 1;
    }
    AttrValue::Static(source.get(start..*cursor).unwrap_or_default())
}

fn svelte_spread_expr(source: &str, start: usize, end: usize) -> Option<&str> {
    let bytes = source.as_bytes();
    let mut cursor = start;
    while cursor < end && bytes[cursor].is_ascii_whitespace() {
        cursor += 1;
    }
    if !starts_with(bytes, cursor, b"...") {
        return None;
    }
    Some(source.get(cursor + 3..end)?.trim())
}

fn strip_vue_modifiers(name: &str) -> &str {
    name.split('.').next().unwrap_or(name)
}

fn read_tag_name(bytes: &[u8], mut cursor: usize, end: usize) -> usize {
    while cursor < end {
        let byte = bytes[cursor];
        if byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-' | b'.') {
            cursor += 1;
        } else {
            break;
        }
    }
    cursor
}

fn read_attr_name(bytes: &[u8], mut cursor: usize, end: usize, framework: Framework) -> usize {
    let mut bracket_depth = 0usize;
    let mut quote = None;
    while cursor < end {
        let byte = bytes[cursor];
        match quote {
            Some(current) if byte == current => quote = None,
            None if byte == b'\'' || byte == b'"' => quote = Some(byte),
            None if matches!(framework, Framework::Vue) && byte == b'[' => bracket_depth += 1,
            None if matches!(framework, Framework::Vue) && byte == b']' => {
                bracket_depth = bracket_depth.saturating_sub(1);
            }
            None if bracket_depth == 0
                && (byte.is_ascii_whitespace() || matches!(byte, b'=' | b'/' | b'>')) =>
            {
                break;
            }
            Some(_) | None => {}
        }
        cursor += 1;
    }
    cursor
}

fn skip_ws_and_tag_comments(bytes: &[u8], cursor: &mut usize, end: usize) {
    loop {
        while *cursor < end && bytes[*cursor].is_ascii_whitespace() {
            *cursor += 1;
        }
        if starts_with(bytes, *cursor, b"//") {
            *cursor = find_bytes(bytes, b"\n", *cursor + 2).map_or(end, |index| index + 1);
            continue;
        }
        if starts_with(bytes, *cursor, b"/*") {
            *cursor = find_bytes(bytes, b"*/", *cursor + 2).map_or(end, |index| index + 2);
            continue;
        }
        break;
    }
}

fn decode_mdx_attribute(source: &str) -> Cow<'_, str> {
    if !source.contains('&') {
        return Cow::Borrowed(source);
    }
    let mut output = String::with_capacity(source.len());
    let mut rest = source;
    while let Some(start) = rest.find('&') {
        output.push_str(&rest[..start]);
        rest = &rest[start..];
        let entity = rest[1..]
            .find(|ch: char| ch == ';' || ch == '&' || ch.is_whitespace())
            .map(|end| end + 1)
            .filter(|&end| rest.as_bytes()[end] == b';')
            .and_then(|end| {
                let name = &rest[1..end];
                let decoded = if let Some(hex) =
                    name.strip_prefix("#x").or_else(|| name.strip_prefix("#X"))
                {
                    u32::from_str_radix(hex, 16).ok().and_then(char::from_u32)
                } else if let Some(decimal) = name.strip_prefix('#') {
                    decimal.parse::<u32>().ok().and_then(char::from_u32)
                } else {
                    oxc_syntax::xml_entities::XML_ENTITIES.get(name).copied()
                };
                decoded.map(|ch| (end, ch))
            });
        if let Some((end, ch)) = entity {
            output.push(ch);
            rest = &rest[end + 1..];
        } else {
            output.push('&');
            rest = &rest[1..];
        }
    }
    output.push_str(rest);
    Cow::Owned(output)
}
