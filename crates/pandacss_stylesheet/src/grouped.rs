//! Tree-based grouping for rules that share `@media` / `@supports` wrapper prefixes.

use indexmap::IndexMap;

use crate::writer::CssWriter;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RuleBody {
    pub selector: String,
    pub declarations: Vec<GroupedDeclaration>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
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
            node = node.children.entry(wrapper.clone()).or_default();
        }
        node.rules.push(body);
    }

    pub fn is_empty(&self) -> bool {
        self.rules.is_empty() && self.children.is_empty()
    }
}

pub(crate) fn write_grouped_rules(writer: &mut CssWriter, root: &mut GroupNode) {
    merge_adjacent_rules(root);
    write_group_node(writer, root);
}

/// Collapse consecutive rules with identical declaration blocks into one
/// comma-joined selector list (e.g. `.a {…} .b {…}` → `.a, .b {…}`). Only
/// adjacent rules merge, so the cascade is preserved; at-rule wrappers are
/// separate children and act as barriers. Mirrors lightningcss's adjacent
/// `CssRuleList::minify` merge.
fn merge_adjacent_rules(node: &mut GroupNode) {
    if node.rules.len() > 1 {
        let mut merged: Vec<RuleBody> = Vec::with_capacity(node.rules.len());
        for body in node.rules.drain(..) {
            match merged.last_mut() {
                Some(last) if last.declarations == body.declarations => {
                    last.selector.push_str(", ");
                    last.selector.push_str(&body.selector);
                }
                _ => merged.push(body),
            }
        }
        node.rules = merged;
    }
    for child in node.children.values_mut() {
        merge_adjacent_rules(child);
    }
}

fn write_group_node(writer: &mut CssWriter, node: &GroupNode) {
    for body in &node.rules {
        writer.rule(&body.selector, |writer| {
            for declaration in &body.declarations {
                writer.declaration(&declaration.prop, &declaration.value, declaration.important);
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

    fn write_css(root: &mut GroupNode) -> String {
        let mut writer = CssWriter::new(false, 256);
        write_grouped_rules(&mut writer, root);
        writer.finish()
    }

    #[test]
    fn merges_rules_under_same_media_wrapper() {
        let media = "@media (width >= 48rem)".to_owned();
        let mut root = GroupNode::default();
        root.push_rule(std::slice::from_ref(&media), rule(".a", "color", "red"));
        root.push_rule(&[media], rule(".b", "color", "blue"));

        let css = write_css(&mut root);
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
        root.push_rule(std::slice::from_ref(&media), rule(".a", "color", "red"));
        root.push_rule(&[media, supports], rule(".b", "display", "grid"));

        let css = write_css(&mut root);
        assert_eq!(
            css,
            "@media (width >= 48rem) {\n  .a {\n    color: red;\n  }\n  @supports (display: grid) {\n    .b {\n      display: grid;\n    }\n  }\n}\n"
        );
    }

    #[test]
    fn merges_adjacent_rules_sharing_a_declaration_block() {
        let mut root = GroupNode::default();
        root.push_rule(&[], rule(".a", "color", "red"));
        root.push_rule(&[], rule(".b", "color", "red"));
        root.push_rule(&[], rule(".c", "color", "red"));

        let css = write_css(&mut root);
        assert_eq!(css, ".a, .b, .c {\n  color: red;\n}\n");
    }

    #[test]
    fn does_not_merge_across_a_different_declaration_rule() {
        let mut root = GroupNode::default();
        root.push_rule(&[], rule(".a", "color", "red"));
        root.push_rule(&[], rule(".b", "color", "blue"));
        root.push_rule(&[], rule(".c", "color", "red"));

        let css = write_css(&mut root);
        assert_eq!(
            css,
            ".a {\n  color: red;\n}\n.b {\n  color: blue;\n}\n.c {\n  color: red;\n}\n"
        );
    }

    #[test]
    fn does_not_merge_across_an_at_rule_wrapper() {
        let media = "@media (width >= 48rem)".to_owned();
        let mut root = GroupNode::default();
        root.push_rule(&[], rule(".a", "color", "red"));
        root.push_rule(&[media], rule(".b", "color", "red"));

        let css = write_css(&mut root);
        assert_eq!(
            css,
            ".a {\n  color: red;\n}\n@media (width >= 48rem) {\n  .b {\n    color: red;\n  }\n}\n"
        );
    }

    #[test]
    fn preserves_first_seen_bucket_order() {
        let sm = "@media (width >= 40rem)".to_owned();
        let lg = "@media (width >= 64rem)".to_owned();
        let mut root = GroupNode::default();
        root.push_rule(std::slice::from_ref(&sm), rule(".sm", "color", "red"));
        root.push_rule(std::slice::from_ref(&lg), rule(".lg", "color", "blue"));
        root.push_rule(&[sm], rule(".sm_again", "color", "green"));

        let css = write_css(&mut root);
        assert_eq!(
            css,
            "@media (width >= 40rem) {\n  .sm {\n    color: red;\n  }\n  .sm_again {\n    color: green;\n  }\n}\n@media (width >= 64rem) {\n  .lg {\n    color: blue;\n  }\n}\n"
        );
    }
}
