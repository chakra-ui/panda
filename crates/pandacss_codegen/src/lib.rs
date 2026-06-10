//! Generates the `styled-system/*` artifacts (the runtime + types the user's
//! code imports) from a resolved config.
//!
//! Flow: an [`artifacts`] builder creates a typed TS [`ast::Module`] for each artifact
//! → [`emit`] prints it, either as source `.ts` or split into runtime `.js` +
//! `.d.ts` (via [`ts_strip`]) → [`graph`] wires modules into a dependency
//! graph of files. [`context::CodegenContext`] carries the config + derived
//! type data every generator reads.

mod artifacts;
mod ast;
mod context;
mod emit;
mod graph;
mod ts_strip;

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
pub use ts_strip::strip_typescript;
