//! Generates the `styled-system/*` artifacts — the runtime and types a user's
//! code imports — from a resolved config.
//!
//! Flow: [`artifacts`] builds a typed [`ast::Module`] per artifact → [`emit`]
//! prints it as `.ts`, or splits it into `.js` + `.d.ts` via [`ts_strip`] →
//! [`graph`] wires modules into a dependency graph of files.
//! [`context::CodegenContext`] carries the config and derived type data every
//! generator reads.

mod artifacts;
mod ast;
mod context;
mod emit;
mod graph;
mod overlay;
mod ts_erase;

pub use ast::{
    Assignment, Block, ConstDecl, ExportDecl, Expr, FunctionDecl, ImportDecl, ImportKind,
    ImportSpecifier, InterfaceDecl, Item, ItemNode, ItemRole, JsDoc, JsxAttr, JsxElement, JsxName,
    Module, ObjectProp, Param, Stmt, TsMember, TsMemberName, TsType, TypeAliasDecl,
};
pub use context::{CodegenContext, CodegenInput, PatternCodegenMeta, PatternJsxCodegenMeta};
pub use emit::{EmitMode, EmitTarget, PrintedFiles, SourceExt, emit_module};
pub use graph::{
    Artifact, ArtifactFile, ArtifactGraph, ArtifactId, ArtifactNode, ConfigDependency,
    DependencySet, GenerateOptions, emit_module_files,
};
pub use overlay::{CodegenOverlay, RuntimeImport};
pub use ts_erase::{erase_typescript_block, erase_typescript_expr, erase_typescript_program};
