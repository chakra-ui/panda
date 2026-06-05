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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::writer::CssWriter;

    fn rule(selector: &str, prop: &str, value: &str) -> RuleBody {
        RuleBody {
            selector: selector.to_owned(),
            declarations: vec![GroupedDeclaration {
                prop: prop.to_owned(),
                value: value.to_owned(),
                important: false,
            }],
        }
    }

    fn write_css(root: &GroupNode) -> String {
        let mut writer = CssWriter::new(false, 256);
        write_grouped_rules(&mut writer, root);
        writer.finish()
    }

    #[test]
    fn merges_rules_under_same_media_wrapper() {
        let media = "@media (width >= 48rem)".to_owned();
        let mut root = GroupNode::default();
        root.push_rule(&[media.clone()], rule(".a", "color", "red"));
        root.push_rule(&[media], rule(".b", "color", "blue"));

        let css = write_css(&root);
        assert_eq!(
            css,
            "@media (width >= 48rem) {\n  .a {\n    color: red;\n  }\n  .b {\n    color: blue;\n  }\n}\n"
        );
    }

    #[test]
    fn nests_shared_prefix_wrappers() {
        let media = "@media (width >= 48rem)".to_owned();
        let supports = "@supports (display: grid)".to_owned();
        let mut root = GroupNode::default();
        root.push_rule(&[media.clone()], rule(".a", "color", "red"));
        root.push_rule(
            &[media, supports],
            rule(".b", "display", "grid"),
        );

        let css = write_css(&root);
        assert_eq!(
            css,
            "@media (width >= 48rem) {\n  .a {\n    color: red;\n  }\n  @supports (display: grid) {\n    .b {\n      display: grid;\n    }\n  }\n}\n"
        );
    }

    #[test]
    fn preserves_first_seen_bucket_order() {
        let sm = "@media (width >= 40rem)".to_owned();
        let lg = "@media (width >= 64rem)".to_owned();
        let mut root = GroupNode::default();
        root.push_rule(&[sm.clone()], rule(".sm", "color", "red"));
        root.push_rule(&[lg.clone()], rule(".lg", "color", "blue"));
        root.push_rule(&[sm], rule(".sm_again", "color", "green"));

        let css = write_css(&root);
        assert_eq!(
            css,
            "@media (width >= 40rem) {\n  .sm {\n    color: red;\n  }\n  .sm_again {\n    color: green;\n  }\n}\n@media (width >= 64rem) {\n  .lg {\n    color: blue;\n  }\n}\n"
        );
    }
}
