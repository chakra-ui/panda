use oxc_ast::ast::{
    BindingPattern, CallExpression, Expression, ObjectExpression, ObjectPropertyKind, Program,
    PropertyKey, PropertyKind, VariableDeclarator,
};
use oxc_ast_visit::Visit;
use pandacss_shared::number_to_js_string;
use rustc_hash::FxHashSet;

use crate::{
    ImportSpecifier, ImportSpecifierKind, Literal, VisitorContext,
    jsx::{ExtractedJsx, Extractor, merge_style_props},
    literal::expression_to_literal,
    span_from_oxc,
};

#[derive(Default)]
pub(crate) struct ReactRuntimeImports {
    direct: FxHashSet<String>,
    namespaces: FxHashSet<String>,
    local_namespaces: FxHashSet<String>,
    bundled_namespaces: FxHashSet<String>,
}

impl ReactRuntimeImports {
    pub(crate) fn from_program(program: &Program<'_>) -> Self {
        let mut imports = Self::default();
        for record in crate::collect_imports(program) {
            if record.type_only {
                continue;
            }
            match record.module.as_str() {
                "react/jsx-runtime" => {
                    imports.collect_specifiers(&record.specifiers, &["jsx", "jsxs"], true);
                }
                "react/jsx-dev-runtime" => {
                    imports.collect_specifiers(&record.specifiers, &["jsxDEV"], true);
                }
                "react" => {
                    imports.collect_react_specifiers(&record.specifiers);
                }
                _ => {}
            }
        }
        let mut collector = RuntimeBindingCollector {
            imports: &mut imports,
        };
        collector.visit_program(program);
        imports
    }

    fn collect_specifiers(
        &mut self,
        specifiers: &[ImportSpecifier],
        direct_names: &[&str],
        namespace_is_runtime: bool,
    ) {
        for specifier in specifiers {
            if specifier.type_only {
                continue;
            }
            match specifier.kind {
                ImportSpecifierKind::Named => {
                    if direct_names.contains(&specifier.imported.as_str()) {
                        self.direct.insert(specifier.local.clone());
                    }
                }
                ImportSpecifierKind::Namespace => {
                    if namespace_is_runtime {
                        self.namespaces.insert(specifier.local.clone());
                    }
                }
                ImportSpecifierKind::Default => {
                    if !namespace_is_runtime {
                        self.namespaces.insert(specifier.local.clone());
                    }
                }
            }
        }
    }

    fn collect_react_specifiers(&mut self, specifiers: &[ImportSpecifier]) {
        for specifier in specifiers {
            if specifier.type_only {
                continue;
            }
            match specifier.kind {
                ImportSpecifierKind::Named => {
                    if specifier.imported == "createElement" {
                        self.direct.insert(specifier.local.clone());
                    }
                }
                ImportSpecifierKind::Default | ImportSpecifierKind::Namespace => {
                    self.namespaces.insert(specifier.local.clone());
                }
            }
        }
    }

    fn is_jsx_call(
        &self,
        callee: &Expression<'_>,
        resolver: Option<&crate::Resolver<'_, '_>>,
        allow_bundled_runtime: bool,
    ) -> bool {
        match normalize_callee(callee) {
            Expression::Identifier(id) => {
                self.direct.contains(id.name.as_str())
                    && resolver.is_none_or(|resolver| resolver.is_import_binding(id))
            }
            Expression::StaticMemberExpression(member) => {
                let Expression::Identifier(root) = &member.object else {
                    return false;
                };
                let property = member.property.name.as_str();
                let is_imported_runtime = self.namespaces.contains(root.name.as_str())
                    && resolver.is_none_or(|resolver| resolver.is_import_binding(root));
                let is_local_runtime = self.local_namespaces.contains(root.name.as_str());
                let is_bundled_runtime = allow_bundled_runtime
                    && self.bundled_namespaces.contains(root.name.as_str())
                    && matches!(property, "jsx" | "jsxs" | "jsxDEV");

                (is_imported_runtime || is_local_runtime || is_bundled_runtime)
                    && matches!(property, "jsx" | "jsxs" | "jsxDEV" | "createElement")
            }
            _ => false,
        }
    }
}

pub(crate) fn extract_call(
    call: &CallExpression<'_>,
    ctx: &VisitorContext<'_, '_>,
    runtime: &ReactRuntimeImports,
    extractor: &Extractor<'_, '_, '_>,
) -> Option<ExtractedJsx> {
    if !runtime.is_jsx_call(&call.callee, ctx.resolver, ctx.config.has_jsx_framework) {
        return None;
    }

    let component = call.arguments.first()?.as_expression()?;
    let props = call.arguments.get(1)?.as_expression()?;
    let resolved = extractor.resolve_runtime_tag(component)?;

    let tag_name = resolved.name.as_ref();
    let entries = props_to_entries(props, ctx.resolver).unwrap_or_default();
    let mut out = Vec::with_capacity(entries.len());
    merge_style_props(&mut out, &ctx.config.jsx, tag_name, entries);
    if out.is_empty() && !resolved.emit_empty {
        return None;
    }

    Some(ExtractedJsx {
        category: resolved.category,
        name: resolved.name.into_owned(),
        alias: resolved.alias.into_owned(),
        data: Literal::Object(out),
        span: span_from_oxc(call.span),
    })
}

fn normalize_callee<'a>(callee: &'a Expression<'a>) -> &'a Expression<'a> {
    match callee {
        Expression::ParenthesizedExpression(parenthesized) => {
            normalize_callee(&parenthesized.expression)
        }
        Expression::SequenceExpression(sequence) => sequence
            .expressions
            .last()
            .map_or(callee, |expr| normalize_callee(expr)),
        _ => callee,
    }
}

struct RuntimeBindingCollector<'a> {
    imports: &'a mut ReactRuntimeImports,
}

impl<'a> Visit<'a> for RuntimeBindingCollector<'_> {
    fn visit_variable_declarator(&mut self, declarator: &VariableDeclarator<'a>) {
        let BindingPattern::BindingIdentifier(id) = &declarator.id else {
            return;
        };
        let name = id.name.as_str();
        let Some(init) = declarator.init.as_ref() else {
            return;
        };
        if is_react_require(init) {
            self.imports.local_namespaces.insert(name.to_owned());
        } else if is_likely_bundled_jsx_runtime_name(name) {
            self.imports.bundled_namespaces.insert(name.to_owned());
        }
    }
}

fn is_react_require(init: &Expression<'_>) -> bool {
    let Expression::CallExpression(call) = normalize_callee(init) else {
        return false;
    };
    let Expression::Identifier(callee) = normalize_callee(&call.callee) else {
        return false;
    };
    if callee.name != "require" {
        return false;
    }
    call.arguments
        .first()
        .and_then(|arg| arg.as_expression())
        .is_some_and(|arg| matches!(arg, Expression::StringLiteral(s) if s.value == "react"))
}

fn is_likely_bundled_jsx_runtime_name(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.contains("jsx") && (lower.contains("runtime") || lower.contains("exports"))
}

fn props_to_entries(
    props: &Expression<'_>,
    resolver: Option<&crate::Resolver<'_, '_>>,
) -> Option<Vec<(String, Literal)>> {
    if let Expression::ObjectExpression(obj) = props {
        return Some(object_props_to_entries(obj, resolver));
    }
    let Literal::Object(entries) = expression_to_literal(props, resolver)? else {
        return None;
    };
    Some(filter_react_props(entries))
}

fn object_props_to_entries(
    obj: &ObjectExpression<'_>,
    resolver: Option<&crate::Resolver<'_, '_>>,
) -> Vec<(String, Literal)> {
    let mut entries = Vec::with_capacity(obj.properties.len());
    for prop in &obj.properties {
        match prop {
            ObjectPropertyKind::ObjectProperty(prop) => {
                if prop.method || prop.kind != PropertyKind::Init {
                    continue;
                }
                let Some(key) = property_key_to_string(&prop.key, prop.computed, resolver) else {
                    continue;
                };
                if is_react_only_prop(&key) {
                    continue;
                }
                let Some(value) = expression_to_literal(&prop.value, resolver) else {
                    continue;
                };
                Literal::upsert_object_entry(&mut entries, key, value);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                if let Some(Literal::Object(inner_entries)) =
                    expression_to_literal(&spread.argument, resolver)
                {
                    for (key, value) in filter_react_props(inner_entries) {
                        Literal::upsert_object_entry(&mut entries, key, value);
                    }
                }
            }
        }
    }
    entries
}

fn filter_react_props(entries: Vec<(String, Literal)>) -> Vec<(String, Literal)> {
    entries
        .into_iter()
        .filter(|(key, _)| !is_react_only_prop(key))
        .collect()
}

fn is_react_only_prop(key: &str) -> bool {
    matches!(key, "children" | "key" | "ref")
}

fn property_key_to_string(
    key: &PropertyKey<'_>,
    computed: bool,
    resolver: Option<&crate::Resolver<'_, '_>>,
) -> Option<String> {
    if !computed {
        return match key {
            PropertyKey::StaticIdentifier(id) => Some(id.name.to_string()),
            PropertyKey::StringLiteral(s) => Some(s.value.to_string()),
            PropertyKey::NumericLiteral(n) => Some(number_to_js_string(n.value)),
            _ => None,
        };
    }
    let expr = key.as_expression()?;
    match expression_to_literal(expr, resolver)? {
        Literal::String(s) => Some(s),
        Literal::Number(n) => Some(number_to_js_string(n)),
        _ => None,
    }
}
