//! Scan a file's top-level export declarations. Feeds the build-info `exports`
//! map (export name → module key) so a consumer can resolve a barrel import
//! (`import { Button } from '@acme/ds'`) to the module it must hydrate.

use oxc_ast::ast::{
    BindingPattern, Declaration, ImportOrExportKind, ModuleExportName, Program, Statement,
};

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ExportInfo {
    /// Export names declared by this module (`export const X`, `export { X as Y }`,
    /// `export default ...`). Resolved to the same module when it contributes CSS.
    pub local: Vec<String>,
    /// Named re-exports (`export { X as Y } from './x'`).
    pub re_exports: Vec<ReExport>,
    /// Star re-export sources (`export * from './x'`). Namespace stars are
    /// intentionally omitted because `modulesFor()` has no namespace shape yet.
    pub export_all: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReExport {
    pub source: String,
    pub imported: String,
    pub exported: String,
}

/// Collect a module's local exports and re-export edges in source order.
#[must_use]
pub fn collect_export_info(program: &Program<'_>) -> ExportInfo {
    let mut info = ExportInfo::default();

    for stmt in &program.body {
        match stmt {
            Statement::ExportNamedDeclaration(decl) => {
                // `export type { … }` — no runtime export surface.
                if decl.export_kind == ImportOrExportKind::Type {
                    continue;
                }

                if let Some(source) = &decl.source {
                    // `export { X as Y } from './x'` — record the edge for project-side resolution.
                    for specifier in &decl.specifiers {
                        if specifier.export_kind == ImportOrExportKind::Type {
                            continue;
                        }

                        info.re_exports.push(ReExport {
                            source: source.value.to_string(),
                            imported: module_export_name(&specifier.local),
                            exported: module_export_name(&specifier.exported),
                        });
                    }
                } else if let Some(declaration) = &decl.declaration {
                    // `export function Foo()` / `export const x = …`
                    push_declaration_names(declaration, &mut info.local);
                } else {
                    // `export { local as Public }` without a `from` clause.
                    for specifier in &decl.specifiers {
                        if specifier.export_kind == ImportOrExportKind::Type {
                            continue;
                        }

                        info.local.push(module_export_name(&specifier.exported));
                    }
                }
            }

            Statement::ExportDefaultDeclaration(_) => {
                info.local.push("default".to_owned());
            }

            Statement::ExportAllDeclaration(decl) => {
                // `export * as NS from './x'` needs namespace handling — skip for now.
                if decl.export_kind == ImportOrExportKind::Type || decl.exported.is_some() {
                    continue;
                }

                info.export_all.push(decl.source.value.to_string());
            }

            _ => {}
        }
    }

    info
}

fn push_declaration_names(declaration: &Declaration<'_>, names: &mut Vec<String>) {
    match declaration {
        Declaration::FunctionDeclaration(func) => {
            if let Some(id) = &func.id {
                names.push(id.name.to_string());
            }
        }
        Declaration::ClassDeclaration(class) => {
            if let Some(id) = &class.id {
                names.push(id.name.to_string());
            }
        }
        Declaration::VariableDeclaration(var) => {
            for declarator in &var.declarations {
                if let BindingPattern::BindingIdentifier(id) = &declarator.id {
                    names.push(id.name.to_string());
                }
            }
        }
        _ => {}
    }
}

fn module_export_name(name: &ModuleExportName<'_>) -> String {
    name.name().to_string()
}
