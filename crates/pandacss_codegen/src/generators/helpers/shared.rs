//! Small AST builders shared by the helper generators — wrap a raw-body
//! function in an `Item` so each helper module reads as a list of declarations.

use crate::{Block, FunctionDecl, Item, ItemNode, Param, Stmt, TsType};

pub(super) fn helper_function<const N: usize>(
    name: &str,
    params: Vec<Param>,
    return_type: TsType,
    body: &str,
    generic_params: [&str; N],
) -> Item {
    Item::both(ItemNode::Function(FunctionDecl {
        exported: true,
        declare: false,
        name: name.into(),
        generic_params: generic_params
            .into_iter()
            .map(std::convert::Into::into)
            .collect(),
        params,
        return_type: Some(return_type),
        body: Some(Block::new(vec![Stmt::Raw(body.into())])),
        js_doc: None,
    }))
}
