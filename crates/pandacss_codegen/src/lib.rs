mod artifact;
mod ast;
mod context;
mod emit;
mod generators;
mod ts_strip;

pub use artifact::{
    Artifact, ArtifactFile, ArtifactGraph, ArtifactId, ArtifactNode, ConfigDependency,
    DependencySet, GenerateOptions, emit_module_files,
};
pub use ast::{
    Assignment, Block, ConstDecl, ExportDecl, Expr, FunctionDecl, ImportDecl, ImportKind,
    ImportSpecifier, InterfaceDecl, Item, ItemNode, ItemRole, JsDoc, JsxAttr, JsxElement, JsxName,
    Module, ObjectProp, Param, Stmt, TsMember, TsMemberName, TsType, TypeAliasDecl,
};
pub use context::{CodegenContext, CodegenInput, PatternCodegenMeta};
pub use emit::{EmitMode, EmitTarget, ModuleSpecifierPolicy, PrintedFiles, SourceExt, emit_module};
pub use ts_strip::strip_typescript;
