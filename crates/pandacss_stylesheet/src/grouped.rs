//! Tree-based grouping for rules that share `@media` / `@supports` wrapper prefixes.

use indexmap::IndexMap;

use crate::writer::CssWriter;

#[derive(Debug, Clone)]
pub(crate) struct RuleBody {
    pub selector: String,
    pub declarations: Vec<GroupedDeclaration>,
}

#[derive(Debug, Clone)]
pub(crate) struct GroupedDeclaration {
    pub prop: String,
    pub value: String,
    pub important: bool,
}

#[derive(Debug, Default)]
pub(crate) struct GroupNode {
    rules: Vec<RuleBody>,
    children: IndexMap<String, GroupNode>,
}

impl GroupNode {
    pub fn push_rule(&mut self, wrappers: &[String], body: RuleBody) {
        let mut node = self;
        for wrapper in wrappers {
            node = node
                .children
                .entry(wrapper.clone())
                .or_insert_with(GroupNode::default);
        }
        node.rules.push(body);
    }

    pub fn is_empty(&self) -> bool {
        self.rules.is_empty() && self.children.is_empty()
    }
}

pub(crate) fn write_grouped_rules(writer: &mut CssWriter, root: &GroupNode) {
    write_group_node(writer, root);
}

fn write_group_node(writer: &mut CssWriter, node: &GroupNode) {
    for body in &node.rules {
        writer.rule(&body.selector, |writer| {
            for declaration in &body.declarations {
                writer.declaration(
                    &declaration.prop,
                    &declaration.value,
                    declaration.important,
                );
            }
        });
    }
    for (wrapper, child) in &node.children {
        writer.at_rule(wrapper, |writer| write_group_node(writer, child));
    }
}
