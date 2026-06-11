//! Print an [`ast::Module`](crate::ast) to source text. Two modes: emit a
//! single `.ts` source file, or *split* into a runtime file (`.js`/`.mjs`, with
//! TS types stripped via [`strip_typescript`]) plus a `.d.ts`. [`EmitTarget`]
//! selects which projection a given print pass produces.

use crate::ast::{
    Assignment, Block, ConstDecl, ExportDecl, Expr, FunctionDecl, ImportDecl, ImportKind,
    ImportSpecifier, InterfaceDecl, Item, ItemNode, ItemRole, JsDoc, JsxAttr, JsxElement, JsxName,
    ObjectProp, Param, Stmt, TsMember, TsMemberName, TsType, TypeAliasDecl,
};
use crate::{Module, ts_strip::strip_typescript};
use pandacss_config::CodegenFormat;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SourceExt {
    Ts,
    Tsx,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EmitMode {
    SourceTs {
        ext: SourceExt,
        import_extensions: bool,
    },
    Split {
        format: CodegenFormat,
        import_extensions: bool,
    },
}

impl EmitMode {
    #[must_use]
    pub fn from_out_extension(
        format: CodegenFormat,
        has_jsx: bool,
        import_extensions: bool,
    ) -> Self {
        if format.is_source_ts() {
            Self::SourceTs {
                ext: if has_jsx {
                    SourceExt::Tsx
                } else {
                    SourceExt::Ts
                },
                import_extensions,
            }
        } else {
            Self::Split {
                format,
                import_extensions,
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EmitTarget {
    SourceTs,
    RuntimeJs,
    Dts,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PrintedFiles {
    pub source_ts: Option<String>,
    pub runtime: Option<String>,
    pub types: Option<String>,
}

#[must_use]
pub fn emit_module(module: &Module, mode: EmitMode) -> PrintedFiles {
    match mode {
        EmitMode::SourceTs {
            import_extensions, ..
        } => PrintedFiles {
            source_ts: Some(with_directive(
                module,
                print_module(module, EmitTarget::SourceTs, import_extensions),
            )),
            runtime: None,
            types: None,
        },
        EmitMode::Split {
            format,
            import_extensions,
        } => PrintedFiles {
            source_ts: None,
            runtime: Some(with_directive(
                module,
                print_module_with_format(
                    module,
                    EmitTarget::RuntimeJs,
                    import_extensions,
                    Some(format),
                ),
            )),
            types: Some(print_module_with_format(
                module,
                EmitTarget::Dts,
                import_extensions,
                Some(format),
            )),
        },
    }
}

/// Prepend the module's directive prologue (e.g. `"use client"`) to emitted
/// runtime/source code. Type declarations never carry directives.
fn with_directive(module: &Module, code: String) -> String {
    match module.directive.as_deref() {
        Some(directive) if !code.is_empty() => format!("\"{directive}\";\n\n{code}"),
        _ => code,
    }
}

#[must_use]
pub fn print_module(module: &Module, target: EmitTarget, import_extensions: bool) -> String {
    print_module_with_format(module, target, import_extensions, None)
}

fn print_module_with_format(
    module: &Module,
    target: EmitTarget,
    import_extensions: bool,
    format: Option<CodegenFormat>,
) -> String {
    #[derive(Clone, Copy, PartialEq, Eq)]
    enum PrintedLineKind {
        Import,
        Export,
        Other,
    }

    let mut lines: Vec<(PrintedLineKind, String)> = Vec::new();

    lines.extend(
        module
            .imports
            .iter()
            .filter(|import| should_print_import(import, target))
            .map(|import| {
                (
                    PrintedLineKind::Import,
                    print_import(import, target, import_extensions, format),
                )
            }),
    );

    lines.extend(
        module
            .items
            .iter()
            .filter(|item| should_print_item(item, target))
            .map(|item| {
                let kind = match item.node {
                    ItemNode::Export(_) => PrintedLineKind::Export,
                    _ => PrintedLineKind::Other,
                };
                (kind, print_item(item, target, import_extensions, format))
            }),
    );

    // Drop blank lines only for the `.d.ts` (where a type-stripped runtime item
    // leaves an empty slot); the `.ts`/`.js` keep them as intentional spacing.
    let lines = lines
        .into_iter()
        .filter(|(_, line)| !line.is_empty() || !matches!(target, EmitTarget::Dts))
        .collect::<Vec<_>>();

    let mut output = String::new();
    for (index, (kind, line)) in lines.iter().enumerate() {
        if index > 0 {
            let previous = lines[index - 1].0;
            let separator = if (previous == PrintedLineKind::Import
                && *kind == PrintedLineKind::Import)
                || (previous == PrintedLineKind::Export && *kind == PrintedLineKind::Export)
            {
                "\n"
            } else {
                "\n\n"
            };
            output.push_str(separator);
        }
        output.push_str(line);
    }

    output.trim().to_string()
}

fn should_print_import(import: &ImportDecl, target: EmitTarget) -> bool {
    match target {
        EmitTarget::SourceTs => true,
        EmitTarget::RuntimeJs => matches!(import.kind, ImportKind::Value),
        EmitTarget::Dts => matches!(import.kind, ImportKind::Type),
    }
}

/// Item visibility per target: `Both` everywhere, `Runtime` items only in the
/// `.ts`/`.js`, `Type` items only in the `.ts`/`.d.ts`. This is what splits one
/// AST into the runtime + types projections.
fn should_print_item(item: &Item, target: EmitTarget) -> bool {
    match (item.role, target) {
        (ItemRole::Both, _)
        | (ItemRole::Runtime, EmitTarget::SourceTs | EmitTarget::RuntimeJs)
        | (ItemRole::Type, EmitTarget::SourceTs | EmitTarget::Dts) => true,
        (ItemRole::Runtime, EmitTarget::Dts) | (ItemRole::Type, EmitTarget::RuntimeJs) => false,
    }
}

fn print_import(
    import: &ImportDecl,
    target: EmitTarget,
    import_extensions: bool,
    format: Option<CodegenFormat>,
) -> String {
    let keyword = match (import.kind, target) {
        (ImportKind::Type, EmitTarget::SourceTs | EmitTarget::Dts) => "import type",
        _ => "import",
    };

    let namespace = import
        .specifiers
        .first()
        .and_then(|specifier| match specifier {
            ImportSpecifier::Namespace(local) if import.specifiers.len() == 1 => Some(local),
            _ => None,
        });
    let specifiers = namespace.map_or_else(
        || {
            format!(
                "{{ {} }}",
                import
                    .specifiers
                    .iter()
                    .map(print_import_specifier)
                    .collect::<Vec<_>>()
                    .join(", ")
            )
        },
        |local| format!("* as {local}"),
    );
    let source = print_source(
        &import.source,
        import.kind,
        target,
        import_extensions,
        format,
    );

    format!("{keyword} {specifiers} from '{source}';")
}

fn print_import_specifier(specifier: &ImportSpecifier) -> String {
    match specifier {
        ImportSpecifier::Named(name) => name.clone(),
        ImportSpecifier::NamedAlias { imported, local } => format!("{imported} as {local}"),
        ImportSpecifier::Namespace(local) => format!("* as {local}"),
    }
}

fn print_source(
    source: &str,
    kind: ImportKind,
    target: EmitTarget,
    import_extensions: bool,
    format: Option<CodegenFormat>,
) -> String {
    if !source.starts_with('.') || !import_extensions {
        return source.to_string();
    }

    match (kind, target) {
        (_, EmitTarget::SourceTs) => format!("{source}.ts"),
        (ImportKind::Value, EmitTarget::RuntimeJs) => {
            let ext = format.unwrap_or(CodegenFormat::Mjs).runtime_extension();
            format!("{source}.{ext}")
        }
        (ImportKind::Value | ImportKind::Type, EmitTarget::Dts) => {
            let ext = format
                .and_then(CodegenFormat::declaration_extension)
                .unwrap_or("d.ts");
            format!("{source}.{ext}")
        }
        _ => source.to_string(),
    }
}

fn print_item(
    item: &Item,
    target: EmitTarget,
    import_extensions: bool,
    format: Option<CodegenFormat>,
) -> String {
    match &item.node {
        ItemNode::Const(decl) => print_const(decl, target),
        ItemNode::Function(decl) => print_function(decl, target),
        ItemNode::Interface(decl) => print_interface(decl),
        ItemNode::TypeAlias(decl) => print_type_alias(decl),
        ItemNode::Assignment(assignment) => print_assignment(assignment),
        ItemNode::Export(decl) => print_export(decl, target, import_extensions, format),
        ItemNode::RawStmt(code) => {
            if matches!(target, EmitTarget::RuntimeJs) {
                strip_typescript_fixpoint(code)
            } else {
                code.clone()
            }
        }
    }
}

fn strip_typescript_fixpoint(code: &str) -> String {
    let mut current = code.to_owned();
    for _ in 0..8 {
        let next = strip_typescript(&current);
        if next == current {
            return next;
        }
        current = next;
    }
    current
}

fn print_export(
    decl: &ExportDecl,
    target: EmitTarget,
    import_extensions: bool,
    format: Option<CodegenFormat>,
) -> String {
    match decl {
        ExportDecl::Star { source } => {
            format!(
                "export * from '{}';",
                print_source(source, ImportKind::Value, target, import_extensions, format)
            )
        }
        ExportDecl::TypeStar { source } => {
            let source = print_source(source, ImportKind::Type, target, import_extensions, format);
            if matches!(target, EmitTarget::SourceTs) {
                format!("export type * from '{source}';")
            } else {
                format!("export * from '{source}';")
            }
        }
        ExportDecl::TypeNamed { names, source } => {
            let source = print_source(source, ImportKind::Type, target, import_extensions, format);
            let list = names.join(", ");
            if matches!(target, EmitTarget::SourceTs) {
                format!("export type {{ {list} }} from '{source}';")
            } else {
                format!("export {{ {list} }} from '{source}';")
            }
        }
    }
}

fn print_const(decl: &ConstDecl, target: EmitTarget) -> String {
    let doc = decl.js_doc.as_ref().map(print_js_doc).unwrap_or_default();
    let export = if decl.exported { "export " } else { "" };
    let declare = if matches!(target, EmitTarget::Dts) && (decl.declare || decl.init.is_some()) {
        "declare "
    } else {
        ""
    };
    let ty = decl
        .type_annotation
        .as_ref()
        .map_or_else(String::new, |ty| {
            if matches!(target, EmitTarget::RuntimeJs) {
                String::new()
            } else {
                format!(": {}", print_type(ty))
            }
        });
    let init = if matches!(target, EmitTarget::Dts) {
        String::new()
    } else {
        decl.init.as_ref().map_or_else(String::new, |expr| {
            let code = print_expr(expr);
            let code = if matches!(target, EmitTarget::RuntimeJs) {
                strip_typescript(&code)
            } else {
                code
            };
            format!(" = {code}")
        })
    };
    let suffix = if matches!(target, EmitTarget::Dts) {
        ";"
    } else {
        ""
    };
    join_doc(
        &doc,
        format!("{export}{declare}const {}{ty}{init}{suffix}", decl.name),
    )
}

fn print_function(decl: &FunctionDecl, target: EmitTarget) -> String {
    let doc = decl.js_doc.as_ref().map(print_js_doc).unwrap_or_default();
    let export = if decl.exported { "export " } else { "" };
    let declare = if matches!(target, EmitTarget::Dts) {
        "declare "
    } else {
        ""
    };
    let generics = if decl.generic_params.is_empty() || matches!(target, EmitTarget::RuntimeJs) {
        String::new()
    } else {
        format!("<{}>", decl.generic_params.join(", "))
    };
    let params = print_params(&decl.params, target);
    let ret = decl.return_type.as_ref().map_or_else(String::new, |ty| {
        if matches!(target, EmitTarget::RuntimeJs) {
            String::new()
        } else {
            format!(": {}", print_type(ty))
        }
    });

    let fn_text = if matches!(target, EmitTarget::Dts) {
        format!(
            "{export}{declare}function {}{generics}({params}){ret};",
            decl.name
        )
    } else {
        let body = decl.body.as_ref().map_or_else(|| "{}".into(), print_block);
        let body = if matches!(target, EmitTarget::RuntimeJs) {
            strip_typescript(&body)
        } else {
            body
        };
        format!(
            "{export}function {}{generics}({params}){ret} {}",
            decl.name, body
        )
    };

    join_doc(&doc, fn_text)
}

fn print_interface(decl: &InterfaceDecl) -> String {
    let doc = decl.js_doc.as_ref().map(print_js_doc).unwrap_or_default();
    let export = if decl.exported { "export " } else { "" };
    let extends = if decl.extends.is_empty() {
        String::new()
    } else {
        format!(
            " extends {}",
            decl.extends
                .iter()
                .map(print_type)
                .collect::<Vec<_>>()
                .join(", ")
        )
    };
    let members = decl
        .members
        .iter()
        .map(print_member)
        .collect::<Vec<_>>()
        .join("\n");
    let body = if members.is_empty() {
        "{}".to_string()
    } else {
        format!("{{\n{members}\n}}")
    };

    join_doc(
        &doc,
        format!("{export}interface {}{extends} {body}", decl.name),
    )
}

fn print_type_alias(decl: &TypeAliasDecl) -> String {
    let doc = decl.js_doc.as_ref().map(print_js_doc).unwrap_or_default();
    let export = if decl.exported { "export " } else { "" };
    let generics = if decl.generic_params.is_empty() {
        String::new()
    } else {
        format!("<{}>", decl.generic_params.join(", "))
    };
    let ty = match &decl.ty {
        TsType::Union(types) => format!("\n{}", print_union_type(types)),
        TsType::Intersection(types) => format!(" {}", print_intersection_type(types)),
        _ => format!(" {};", print_type(&decl.ty)),
    };
    join_doc(&doc, format!("{export}type {}{generics} ={ty}", decl.name))
}

fn print_assignment(assignment: &Assignment) -> String {
    format!(
        "{} = {}",
        print_expr(&assignment.left),
        print_expr(&assignment.right)
    )
}

fn print_member(member: &TsMember) -> String {
    print_member_with_indent(member, 2)
}

fn print_member_with_indent(member: &TsMember, spaces: usize) -> String {
    let doc = member.js_doc.as_ref().map(print_js_doc).unwrap_or_default();
    let optional = if member.optional { "?" } else { "" };
    let prefix = " ".repeat(spaces);
    let line = format!(
        "{prefix}{}{}: {}",
        print_member_name(&member.name),
        optional,
        print_type(&member.ty)
    );
    join_doc(&indent(&doc, spaces), line)
}

fn print_member_name(name: &TsMemberName) -> String {
    match name {
        TsMemberName::Ident(value) | TsMemberName::Raw(value) => value.clone(),
        TsMemberName::StringLiteral(value) => format!("{value:?}"),
        TsMemberName::Mapped { key, constraint } => {
            format!("[{key} in {}]", print_type(constraint))
        }
    }
}

fn print_stmt(stmt: &Stmt) -> String {
    match stmt {
        Stmt::Const { name, init } => format!("const {name} = {}", print_expr(init)),
        Stmt::ConstDestructure { names, init } => {
            format!("const [{}] = {}", names.join(", "), print_expr(init))
        }
        Stmt::Return(expr) => format!("return {}", print_expr(expr)),
        Stmt::Expr(expr) => print_expr(expr),
        Stmt::Raw(code) => code.clone(),
    }
}

fn print_expr(expr: &Expr) -> String {
    match expr {
        Expr::Ident(value) | Expr::Number(value) | Expr::Raw(value) => value.clone(),
        Expr::String(value) => format!("{value:?}"),
        Expr::Bool(value) => value.to_string(),
        Expr::Null => "null".into(),
        Expr::Undefined => "undefined".into(),
        Expr::Object(props) => print_object(props),
        Expr::Array(items) => {
            let items = items.iter().map(print_expr).collect::<Vec<_>>().join(", ");
            format!("[{items}]")
        }
        Expr::Call { callee, args } => {
            let args = args.iter().map(print_expr).collect::<Vec<_>>().join(", ");
            format!("{}({args})", print_expr(callee))
        }
        Expr::Member { object, property } => format!("{}.{}", print_expr(object), property),
        Expr::Arrow { params, body } => format!(
            "({}) => {}",
            print_params(params, EmitTarget::SourceTs),
            print_expr(body)
        ),
        Expr::Function { name, params, body } => {
            let name = name
                .as_ref()
                .map_or_else(String::new, |name| format!(" {name}"));
            format!(
                "function{name}({}) {}",
                print_params(params, EmitTarget::SourceTs),
                print_block(body)
            )
        }
        Expr::JsxElement(element) => print_jsx_element(element),
    }
}

fn print_object(props: &[ObjectProp]) -> String {
    if props.is_empty() {
        return "{}".into();
    }

    let props = props
        .iter()
        .map(|prop| match prop {
            ObjectProp::KeyValue(key, value) => format!("{key}: {}", print_expr(value)),
            ObjectProp::Shorthand(name) => name.clone(),
            ObjectProp::Spread(name) => format!("...{name}"),
            ObjectProp::Method { name, params, body } => {
                format!(
                    "{name}({}) {}",
                    print_params(params, EmitTarget::SourceTs),
                    print_block(body)
                )
            }
        })
        .collect::<Vec<_>>()
        .join(", ");
    format!("{{ {props} }}")
}

fn print_jsx_element(element: &JsxElement) -> String {
    let name = match &element.name {
        JsxName::Ident(name) => name.clone(),
        JsxName::Member { object, property } => format!("{object}.{property}"),
    };
    let attrs = element
        .attrs
        .iter()
        .map(print_jsx_attr)
        .collect::<Vec<_>>()
        .join(" ");
    let attrs = if attrs.is_empty() {
        String::new()
    } else {
        format!(" {attrs}")
    };

    if element.self_closing {
        return format!("<{name}{attrs} />");
    }

    let children = element.children.iter().map(print_expr).collect::<String>();
    format!("<{name}{attrs}>{children}</{name}>")
}

fn print_jsx_attr(attr: &JsxAttr) -> String {
    match attr {
        JsxAttr::Named(name) => name.clone(),
        JsxAttr::NamedExpr(name, expr) => format!("{name}={{{}}}", print_expr(expr)),
        JsxAttr::Spread(name) => format!("{{...{name}}}"),
    }
}

fn print_params(params: &[Param], target: EmitTarget) -> String {
    params
        .iter()
        .map(|param| {
            if matches!(target, EmitTarget::RuntimeJs) {
                return param.name.clone();
            }

            param.type_annotation.as_ref().map_or_else(
                || param.name.clone(),
                |ty| {
                    let optional = if param.optional { "?" } else { "" };
                    format!("{}{optional}: {}", param.name, print_type(ty))
                },
            )
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn print_block(block: &Block) -> String {
    if block.stmts.is_empty() {
        return "{}".into();
    }

    let stmts = block
        .stmts
        .iter()
        .map(|stmt| indent(&print_stmt(stmt), 2))
        .collect::<Vec<_>>()
        .join("\n");
    format!("{{\n{stmts}\n}}")
}

fn print_type(ty: &TsType) -> String {
    match ty {
        TsType::Ref(value) | TsType::Raw(value) => value.clone(),
        TsType::TypeRef { name, args } => {
            if args.is_empty() {
                name.clone()
            } else {
                format!(
                    "{name}<{}>",
                    args.iter().map(print_type).collect::<Vec<_>>().join(", ")
                )
            }
        }
        TsType::StringLiteral(value) => format!("{value:?}"),
        TsType::Bool => "boolean".into(),
        TsType::Null => "null".into(),
        TsType::Unknown => "unknown".into(),
        TsType::Void => "void".into(),
        TsType::Array(inner) => format!("Array<{}>", print_type(inner)),
        TsType::Union(types) => types.iter().map(print_type).collect::<Vec<_>>().join(" | "),
        TsType::Intersection(types) => types.iter().map(print_type).collect::<Vec<_>>().join(" & "),
        TsType::Object(members) => print_object_type(members),
        TsType::Mapped {
            key,
            constraint,
            optional,
            ty,
        } => {
            let optional = if *optional { "?" } else { "" };
            format!(
                "[{key} in {}]{optional}: {}",
                print_type(constraint),
                print_type(ty)
            )
        }
        TsType::KeyOf(inner) => format!("keyof {}", print_type(inner)),
        TsType::Function { params, ret } => {
            format!(
                "({}) => {}",
                print_params(params, EmitTarget::SourceTs),
                print_type(ret)
            )
        }
    }
}

fn print_union_type(types: &[TsType]) -> String {
    types
        .iter()
        .map(|ty| {
            let ty = print_type(ty);
            let mut lines = ty.lines();
            let first = lines.next().unwrap_or_default();
            let rest = lines
                .map(|line| format!("    {line}"))
                .collect::<Vec<_>>()
                .join("\n");
            if rest.is_empty() {
                format!("  | {first}")
            } else {
                format!("  | {first}\n{rest}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn print_intersection_type(types: &[TsType]) -> String {
    types.iter().map(print_type).collect::<Vec<_>>().join(" & ")
}

fn print_object_type(members: &[TsMember]) -> String {
    if members.is_empty() {
        return "{}".into();
    }

    format!(
        "{{\n{}\n}}",
        members
            .iter()
            .map(|member| print_member_with_indent(member, 2))
            .collect::<Vec<_>>()
            .join("\n")
    )
}

fn print_js_doc(doc: &JsDoc) -> String {
    let mut lines = vec!["/**".to_string()];
    if let Some(text) = &doc.text {
        lines.push(format!(" * {text}"));
    }
    if let Some(deprecated) = &doc.deprecated {
        if deprecated.is_empty() {
            lines.push(" * @deprecated".into());
        } else {
            lines.push(format!(" * @deprecated {deprecated}"));
        }
    }
    if let Some(default) = &doc.default {
        lines.push(format!(" * @default {default}"));
    }
    lines.push(" */".into());
    lines.join("\n")
}

fn join_doc(doc: &str, code: String) -> String {
    if doc.is_empty() {
        code
    } else {
        format!("{doc}\n{code}")
    }
}

fn indent(input: &str, spaces: usize) -> String {
    let prefix = " ".repeat(spaces);
    input
        .lines()
        .map(|line| {
            if line.is_empty() {
                String::new()
            } else {
                format!("{prefix}{line}")
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}
