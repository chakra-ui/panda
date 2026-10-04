//! Framework-template style-prop extraction.
//!
//! This complements the expression adapter: Vue/Svelte template attrs like
//! `<Box color="red" />` are not JS expressions, so they are collected
//! directly into the same `ExtractedJsx` shape the JSX visitor emits.

use crate::adapter::{AdaptedSource, SfcFormat};
use crate::{
    ExtractedJsx, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory, MatchedImport,
    Span,
    jsx::{merge_style_prop, merge_style_props},
    literal::expression_to_literal,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{BindingPattern, Expression, Program, Statement, VariableDeclaration};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use pandacss_sfc::astro::{AstroAttributeValue, AstroElement};
use pandacss_sfc::js::find_closing_brace as find_matching_brace;
use pandacss_sfc::markup::{
    Expressions, MarkupWalker, blank_like, copy_range, find_bytes, finish_mask, starts_with,
};
use rustc_hash::FxHashMap;
use std::borrow::Cow;

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
        SfcFormat::Astro => Cow::Borrowed(adapted.code.as_ref()),
    };
    let mut literal_index = TemplateLiteralIndex {
        resolver,
        ranges: MarkupRanges::new(template_markup_ranges(source, adapted)),
        literals: FxHashMap::default(),
    };
    literal_index.visit_program(program);
    let context = TemplateContext {
        source: context_source.as_ref(),
        raw_source: source,
        path,
        matched,
        config,
        cross_file: resolver.cross_file_context(),
        literals: literal_index.literals,
        retain_transform_facts,
    };
    let scan = TemplateScan {
        framework: match format {
            SfcFormat::Vue => Framework::Vue,
            SfcFormat::Svelte | SfcFormat::Astro => Framework::Svelte,
        },
        adapted,
        matched,
        config,
        context: &context,
    };
    match format {
        SfcFormat::Vue => collect_vue_template_styles(source, &scan),
        SfcFormat::Svelte => collect_svelte_template_styles(source, &scan),
        SfcFormat::Astro => collect_astro_template_styles(source, &adapted.astro_elements, &scan),
    }
}

fn mask_script_blocks(source: &str, scripts: &[pandacss_sfc::markup::TagBlock]) -> String {
    let mut mask = blank_like(source);
    for block in scripts {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }
    finish_mask(mask)
}

struct TemplateContext<'a> {
    source: &'a str,
    raw_source: &'a str,
    path: &'a str,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
    cross_file: Option<&'a crate::cross_file::CrossFileContext<'a>>,
    literals: FxHashMap<(u32, u32), Literal>,
    retain_transform_facts: bool,
}

struct TemplateLiteralIndex<'resolver, 'ast, 'callback> {
    resolver: &'resolver crate::Resolver<'ast, 'callback>,
    ranges: MarkupRanges,
    literals: FxHashMap<(u32, u32), Literal>,
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
        if self.ranges.contains(span.start, span.end)
            && let Some(literal) = expression_to_literal(expression, Some(self.resolver))
        {
            self.literals.insert((span.start, span.end), literal);
        }
        walk::walk_expression(self, expression);
    }
}

struct TemplateScan<'a> {
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

fn collect_astro_template_styles(
    source: &str,
    elements: &[AstroElement],
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
        let mut entries = Vec::new();
        for attribute in &element.attributes {
            let value = match &attribute.value {
                AstroAttributeValue::Spread(expression) => {
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
                AstroAttributeValue::Empty => continue,
                AstroAttributeValue::Boolean => AttrValue::Bool,
                AstroAttributeValue::Static(value) => match slice(value) {
                    Some(value) => AttrValue::Static(value),
                    None => continue,
                },
                AstroAttributeValue::Expression(expression) => match slice(expression) {
                    Some(expression) => AttrValue::Expr(expression),
                    None => continue,
                },
            };
            let Some(name) = attribute.name.as_ref().and_then(slice) else {
                continue;
            };
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
    let Some(resolved) = resolve_template_tag(tag_name, scan.matched, scan.config, scan.framework)
    else {
        return Tag::Collected(tag_end + 1);
    };

    let mut entries = Vec::new();
    collect_attrs(
        source,
        name_end,
        tag_end,
        scan,
        resolved.name.as_ref(),
        &mut entries,
    );

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
    if entries.is_empty() && !resolved.emit_empty {
        return;
    }
    let kind = crate::jsx::jsx_kind(&scan.config.matchers, &resolved.name, &resolved.alias);
    let data = Literal::Object(entries);
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
    let value = if is_expr && matches!(value, AttrValue::Bool) {
        parse_expression_literal(&camelize(name), Some(context))
    } else {
        attr_literal(value, is_expr, context)
    };
    let Some(value) = value else {
        return;
    };
    merge_style_prop(entries, &config.jsx, tag_name, name, value);
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
    let Some(value) = attr_literal(value, is_expr, context) else {
        return;
    };
    merge_style_prop(entries, &config.jsx, tag_name, raw_name, value);
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
        Some(SfcFormat::Astro) => {
            for element in &adapted.astro_elements {
                for attribute in &element.attributes {
                    if let AstroAttributeValue::Expression(expression)
                    | AstroAttributeValue::Spread(expression) = &attribute.value
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
