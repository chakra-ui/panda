#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Module {
    pub imports: Vec<ImportDecl>,
    pub items: Vec<Item>,
}

impl Module {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn with_import(mut self, import: ImportDecl) -> Self {
        self.imports.push(import);
        self
    }

    #[must_use]
    pub fn with_item(mut self, item: Item) -> Self {
        self.items.push(item);
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportDecl {
    pub kind: ImportKind,
    pub specifiers: Vec<ImportSpecifier>,
    pub source: String,
}

impl ImportDecl {
    #[must_use]
    pub fn value<const N: usize>(specifiers: [&str; N], source: &str) -> Self {
        Self {
            kind: ImportKind::Value,
            specifiers: specifiers
                .into_iter()
                .map(|name| ImportSpecifier::Named(name.into()))
                .collect(),
            source: source.into(),
        }
    }

    #[must_use]
    pub fn ty<const N: usize>(specifiers: [&str; N], source: &str) -> Self {
        Self {
            kind: ImportKind::Type,
            specifiers: specifiers
                .into_iter()
                .map(|name| ImportSpecifier::Named(name.into()))
                .collect(),
            source: source.into(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ImportKind {
    Value,
    Type,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ImportSpecifier {
    Named(String),
    NamedAlias { imported: String, local: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub role: ItemRole,
    pub node: ItemNode,
}

impl Item {
    #[must_use]
    pub fn runtime(node: ItemNode) -> Self {
        Self {
            role: ItemRole::Runtime,
            node,
        }
    }

    #[must_use]
    pub fn ty(node: ItemNode) -> Self {
        Self {
            role: ItemRole::Type,
            node,
        }
    }

    #[must_use]
    pub fn both(node: ItemNode) -> Self {
        Self {
            role: ItemRole::Both,
            node,
        }
    }

    #[must_use]
    pub fn const_decl(decl: ConstDecl) -> Self {
        Self::runtime(ItemNode::Const(decl))
    }

    #[must_use]
    pub fn function_decl(decl: FunctionDecl) -> Self {
        Self::runtime(ItemNode::Function(decl))
    }

    #[must_use]
    pub fn interface_decl(decl: InterfaceDecl) -> Self {
        Self::ty(ItemNode::Interface(decl))
    }

    #[must_use]
    pub fn type_alias(decl: TypeAliasDecl) -> Self {
        Self::ty(ItemNode::TypeAlias(decl))
    }

    #[must_use]
    pub fn assignment(assignment: Assignment) -> Self {
        Self::runtime(ItemNode::Assignment(assignment))
    }

    #[must_use]
    pub fn raw_stmt(code: &str) -> Self {
        Self::runtime(ItemNode::RawStmt(code.into()))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemRole {
    Runtime,
    Type,
    Both,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ItemNode {
    Const(ConstDecl),
    Function(FunctionDecl),
    Interface(InterfaceDecl),
    TypeAlias(TypeAliasDecl),
    Assignment(Assignment),
    Export(ExportDecl),
    RawStmt(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExportDecl {
    Star { source: String },
    TypeStar { source: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConstDecl {
    pub exported: bool,
    pub declare: bool,
    pub name: String,
    pub type_annotation: Option<TsType>,
    pub init: Option<Expr>,
    pub js_doc: Option<JsDoc>,
}

impl ConstDecl {
    #[must_use]
    pub fn exported(name: &str, init: Expr) -> Self {
        Self {
            exported: true,
            declare: false,
            name: name.into(),
            type_annotation: None,
            init: Some(init),
            js_doc: None,
        }
    }

    #[must_use]
    pub fn declare_exported(name: &str, ty: TsType) -> Self {
        Self {
            exported: true,
            declare: true,
            name: name.into(),
            type_annotation: Some(ty),
            init: None,
            js_doc: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FunctionDecl {
    pub exported: bool,
    pub declare: bool,
    pub name: String,
    pub generic_params: Vec<String>,
    pub params: Vec<Param>,
    pub return_type: Option<TsType>,
    pub body: Option<Block>,
    pub js_doc: Option<JsDoc>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InterfaceDecl {
    pub exported: bool,
    pub name: String,
    pub extends: Vec<TsType>,
    pub members: Vec<TsMember>,
    pub js_doc: Option<JsDoc>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeAliasDecl {
    pub exported: bool,
    pub name: String,
    pub generic_params: Vec<String>,
    pub ty: TsType,
    pub js_doc: Option<JsDoc>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Assignment {
    pub left: Expr,
    pub right: Expr,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Block {
    pub stmts: Vec<Stmt>,
}

impl Block {
    #[must_use]
    pub fn new(stmts: Vec<Stmt>) -> Self {
        Self { stmts }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Stmt {
    Const { name: String, init: Expr },
    ConstDestructure { names: Vec<String>, init: Expr },
    Return(Expr),
    Expr(Expr),
    Raw(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Expr {
    Ident(String),
    String(String),
    Bool(bool),
    Number(String),
    Null,
    Undefined,
    Object(Vec<ObjectProp>),
    Array(Vec<Expr>),
    Call {
        callee: Box<Expr>,
        args: Vec<Expr>,
    },
    Member {
        object: Box<Expr>,
        property: String,
    },
    Arrow {
        params: Vec<Param>,
        body: Box<Expr>,
    },
    Function {
        name: Option<String>,
        params: Vec<Param>,
        body: Block,
    },
    JsxElement(JsxElement),
    Raw(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ObjectProp {
    KeyValue(String, Expr),
    Shorthand(String),
    Spread(String),
    Method {
        name: String,
        params: Vec<Param>,
        body: Block,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Param {
    pub name: String,
    pub optional: bool,
    pub type_annotation: Option<TsType>,
}

impl Param {
    #[must_use]
    pub fn ident(name: &str) -> Self {
        Self {
            name: name.into(),
            optional: false,
            type_annotation: None,
        }
    }

    #[must_use]
    pub fn typed(name: &str, ty: TsType) -> Self {
        Self {
            name: name.into(),
            optional: false,
            type_annotation: Some(ty),
        }
    }

    #[must_use]
    pub fn optional(name: &str, ty: TsType) -> Self {
        Self {
            name: name.into(),
            optional: true,
            type_annotation: Some(ty),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JsxElement {
    pub name: JsxName,
    pub attrs: Vec<JsxAttr>,
    pub children: Vec<Expr>,
    pub self_closing: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JsxName {
    Ident(String),
    Member { object: String, property: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JsxAttr {
    Named(String),
    NamedExpr(String, Expr),
    Spread(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TsType {
    Ref(String),
    TypeRef {
        name: String,
        args: Vec<TsType>,
    },
    StringLiteral(String),
    Bool,
    Null,
    Unknown,
    Void,
    Array(Box<TsType>),
    Union(Vec<TsType>),
    Intersection(Vec<TsType>),
    Object(Vec<TsMember>),
    Mapped {
        key: String,
        constraint: Box<TsType>,
        optional: bool,
        ty: Box<TsType>,
    },
    KeyOf(Box<TsType>),
    Function {
        params: Vec<Param>,
        ret: Box<TsType>,
    },
    Raw(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TsMember {
    pub name: TsMemberName,
    pub optional: bool,
    pub ty: TsType,
    pub js_doc: Option<JsDoc>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TsMemberName {
    Ident(String),
    StringLiteral(String),
    Mapped { key: String, constraint: TsType },
    Raw(String),
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct JsDoc {
    pub text: Option<String>,
    pub deprecated: Option<String>,
    pub default: Option<String>,
}
