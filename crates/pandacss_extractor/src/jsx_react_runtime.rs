use oxc_ast::ast::{BindingPattern, CallExpression, Expression, Program, VariableDeclarator};
use oxc_ast_visit::Visit;
use oxc_span::GetSpan;
use rustc_hash::FxHashSet;

use crate::{
    ImportSpecifier, ImportSpecifierKind, Literal, VisitorContext,
    jsx::{ExtractedJsx, Extractor},
    span_from_oxc,
    style_tree::project_literal,
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
    let style = crate::style_tree::props_expression_to_style_tree(
        props,
        ctx.resolver,
        &ctx.config.jsx,
        tag_name,
    );
    let data = style
        .as_ref()
        .and_then(project_literal)
        .unwrap_or_else(|| Literal::Object(vec![]));
    let data_empty = matches!(&data, Literal::Object(entries) if entries.is_empty());
    if data_empty && !resolved.emit_empty {
        return None;
    }

    let kind = crate::jsx::jsx_kind(&ctx.config.matchers, &resolved.name, &resolved.alias);
    let retain = extractor.retain_transform_facts;
    Some(ExtractedJsx {
        category: resolved.category,
        kind,
        name: resolved.name.into_owned(),
        alias: resolved.alias.into_owned(),
        data,
        span: span_from_oxc(call.span),
        closing_span: None,
        attributes: Vec::new(),
        panda_owned: resolved.panda_owned,
        style: if retain { style } else { None },
        source: if retain {
            crate::JsxSourceFacts {
                kind: crate::JsxSourceKind::RuntimeCall,
                callee_span: Some(span_from_oxc(call.callee.span())),
                factory_intrinsic: crate::jsx::factory_intrinsic_from_expression(component),
                args: call
                    .arguments
                    .iter()
                    .filter_map(|argument| argument.as_expression())
                    .map(crate::transform_facts::expression_facts)
                    .collect(),
            }
        } else {
            crate::JsxSourceFacts::default()
        },
    })
}

fn normalize_callee<'a>(callee: &'a Expression<'a>) -> &'a Expression<'a> {
    let callee = callee.get_inner_expression();
    match callee {
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
