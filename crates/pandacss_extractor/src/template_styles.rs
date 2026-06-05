//! Framework-template style-prop extraction.
//!
//! This complements the expression adapter: Vue/Svelte template attrs like
//! `<Box color="red" />` are not JS expressions, so they are collected
//! directly into the same `ExtractedJsx` shape the JSX visitor emits.

use crate::adapter::{
    blank_like, copy_range, find_bytes, find_matching_brace, has_extension, starts_with, tag_blocks,
};
use crate::{
    ExtractedJsx, ExtractorConfig, ImportSpecifierKind, Literal, MatchCategory, MatchedImport,
    Span,
    jsx::{merge_style_prop, merge_style_props},
    literal::expression_to_literal,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::{BindingPattern, Statement, VariableDeclaration};
use oxc_parser::Parser;
use oxc_span::SourceType;
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
}

#[must_use]
pub(crate) fn collect_template_styles(
    source: &str,
    path: &str,
    matched: &[MatchedImport],
    config: &ExtractorConfig,
) -> Vec<ExtractedJsx> {
    let context_source = template_context_source(source, path);
    let context = TemplateContext {
        source: context_source.as_ref(),
        path,
        matched,
        config,
    };
    if has_extension(path, "vue") {
        return collect_vue_template_styles(source, matched, config, &context);
    }
    if has_extension(path, "svelte") {
        return collect_svelte_template_styles(source, matched, config, &context);
    }
    Vec::new()
}

fn template_context_source<'a>(source: &'a str, path: &str) -> Cow<'a, str> {
    if has_extension(path, "vue") || has_extension(path, "svelte") {
        return Cow::Owned(mask_script_blocks(source));
    }
    crate::adapt_source(source, path)
}

fn mask_script_blocks(source: &str) -> String {
    let mut mask = blank_like(source);
    for block in tag_blocks(source, "script") {
        copy_range(&mut mask, source, block.content_start, block.content_end);
    }
    String::from_utf8(mask).expect("source mask remains valid utf-8")
}

struct TemplateContext<'a> {
    source: &'a str,
    path: &'a str,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
}

struct TemplateScan<'a> {
    framework: Framework,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
    context: &'a TemplateContext<'a>,
}

fn collect_vue_template_styles(
    source: &str,
    matched: &[MatchedImport],
    config: &ExtractorConfig,
    context: &TemplateContext<'_>,
) -> Vec<ExtractedJsx> {
    let mut out = Vec::new();
    let scan = TemplateScan {
        framework: Framework::Vue,
        matched,
        config,
        context,
    };
    for block in tag_blocks(source, "template") {
        if has_non_html_lang(source, block.open_start, block.open_end) {
            continue;
        }
        collect_markup_range(
            source,
            block.content_start,
            block.content_end,
            &scan,
            &mut out,
        );
    }
    out
}

fn collect_svelte_template_styles(
    source: &str,
    matched: &[MatchedImport],
    config: &ExtractorConfig,
    context: &TemplateContext<'_>,
) -> Vec<ExtractedJsx> {
    let scripts = tag_blocks(source, "script");
    let styles = tag_blocks(source, "style");
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
    let scan = TemplateScan {
        framework: Framework::Svelte,
        matched,
        config,
        context,
    };
    let mut cursor = 0;
    for (start, end) in excluded {
        if cursor < start {
            collect_markup_range(source, cursor, start, &scan, &mut out);
        }
        cursor = end;
    }
    if cursor < source.len() {
        collect_markup_range(source, cursor, source.len(), &scan, &mut out);
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
    let mut cursor = start;
    while cursor < end {
        if starts_with(bytes, cursor, b"<!--") {
            cursor = find_bytes(bytes, b"-->", cursor + 4).map_or(end, |index| index + 3);
            continue;
        }
        if bytes[cursor] == b'<'
            && let Some(next) = collect_tag(source, cursor, end, scan, out)
        {
            cursor = next;
            continue;
        }
        cursor += 1;
    }
}

fn collect_tag(
    source: &str,
    tag_start: usize,
    limit: usize,
    scan: &TemplateScan<'_>,
    out: &mut Vec<ExtractedJsx>,
) -> Option<usize> {
    let bytes = source.as_bytes();
    let first = *bytes.get(tag_start + 1)?;
    if matches!(first, b'/' | b'!' | b'?') {
        return None;
    }

    let tag_end = find_markup_tag_end(source, tag_start + 1, limit)?;
    let name_start = tag_start + 1;
    let name_end = read_tag_name(bytes, name_start, tag_end);
    if name_end == name_start {
        return Some(tag_end + 1);
    }
    let tag_name = source.get(name_start..name_end)?;
    let Some(resolved) = resolve_template_tag(tag_name, scan.matched, scan.config) else {
        return Some(tag_end + 1);
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

    if !entries.is_empty() {
        out.push(ExtractedJsx {
            category: resolved.category,
            name: resolved.name.into_owned(),
            alias: resolved.alias.into_owned(),
            data: Literal::Object(entries),
            span: Span {
                start: u32::try_from(tag_start).unwrap_or(u32::MAX),
                end: u32::try_from(tag_end + 1).unwrap_or(u32::MAX),
            },
        });
    }

    Some(tag_end + 1)
}

fn resolve_template_tag<'a>(
    tag_name: &'a str,
    matched: &'a [MatchedImport],
    config: &'a ExtractorConfig,
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
                    });
                }
            }
            _ => {}
        }
    }
    if config.jsx.should_match_tag(tag_name) {
        return Some(ResolvedTemplateTag {
            category: MatchCategory::Jsx,
            name: Cow::Borrowed(tag_name),
            alias: Cow::Borrowed(tag_name),
        });
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
            && let Some(close) = find_matching_brace(source, cursor)
            && close <= end
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
    let Some(value) = attr_literal(value, is_expr, context) else {
        return;
    };
    merge_style_prop(entries, &config.jsx, tag_name, name, value);
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
    let wrapped = if let Some(context) = context {
        format!("{}\n;const __p = ({source});", context.source)
    } else {
        format!("const __p = ({source});")
    };
    let allocator = Allocator::default();
    let parser_return = Parser::new(&allocator, &wrapped, SourceType::tsx()).parse();
    let resolver = context.map(|context| {
        crate::Resolver::build(
            &parser_return.program,
            context.matched,
            Some(&context.config.matchers),
            context.config.token_dictionary.as_deref(),
            context.config.cross_file.as_ref(),
            Some(std::path::PathBuf::from(context.path)),
            None,
            None,
        )
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
        && let Some(close) = find_matching_brace(source, *cursor)
        && close <= end
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

fn find_markup_tag_end(source: &str, from: usize, limit: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut quote = None;
    let mut brace_depth = 0usize;
    let mut index = from;
    while index < limit {
        let byte = bytes[index];
        match quote {
            Some(current) if byte == current => quote = None,
            None if byte == b'\'' || byte == b'"' => quote = Some(byte),
            None if byte == b'{' => brace_depth += 1,
            None if byte == b'}' => brace_depth = brace_depth.saturating_sub(1),
            None if byte == b'>' && brace_depth == 0 => return Some(index),
            Some(_) | None => {}
        }
        index += 1;
    }
    None
}

fn has_non_html_lang(source: &str, start: usize, end: usize) -> bool {
    let Some(attrs) = source.get(start..=end) else {
        return false;
    };
    let lower = attrs.to_ascii_lowercase();
    let Some(lang_index) = lower.find("lang") else {
        return false;
    };
    let after_lang = lang_index + "lang".len();
    let Some(rest) = lower.get(after_lang..) else {
        return false;
    };
    if !rest.trim_start().starts_with('=') {
        return false;
    }
    let value = rest
        .trim_start()
        .trim_start_matches('=')
        .trim_start()
        .trim_matches(|ch| ch == '"' || ch == '\'' || ch == '>' || ch == '/')
        .split_ascii_whitespace()
        .next()
        .unwrap_or_default();
    !matches!(value, "" | "html")
}
