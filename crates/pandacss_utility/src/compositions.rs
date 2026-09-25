use pandacss_config::Theme;
use pandacss_literal::Literal;
use rustc_hash::FxHashMap;
use serde_json::Value;

use crate::{Utility, UtilityProperty};

const COMPOSITIONS_LAYER: &str = "compositions";

pub(super) fn register(utility: &mut Utility, theme: &Theme) {
    register_group(utility, "textStyle", &theme.text_styles);
    register_group(utility, "layerStyle", &theme.layer_styles);
    register_group(utility, "animationStyle", &theme.animation_styles);
}

fn register_group(utility: &mut Utility, prop_name: &str, source: &Value) {
    let Value::Object(root) = source else {
        return;
    };

    let mut values = FxHashMap::default();
    walk_tree(root, "", &mut values);
    if values.is_empty() {
        return;
    }

    utility.register_property(
        prop_name.to_owned(),
        UtilityProperty {
            class_name: Some(prop_name.to_owned()),
            css_property: None,
            mapped_css_property: None,
            layer: Some(COMPOSITIONS_LAYER.to_owned()),
            values,
            values_category: None,
            transform_callback_id: None,
        },
    );
}

fn walk_tree(
    node: &serde_json::Map<String, Value>,
    prefix: &str,
    out: &mut FxHashMap<String, Literal>,
) {
    for (key, value) in node {
        let path = if prefix.is_empty() {
            key.clone()
        } else {
            format!("{prefix}.{key}")
        };

        match value {
            Value::Object(entries) => {
                if let Some(styles) = entries.get("value") {
                    if let Some(literal) = Literal::from_json(styles) {
                        out.insert(path, literal);
                    }
                } else {
                    walk_tree(entries, &path, out);
                }
            }
            _ => {
                if let Some(literal) = Literal::from_json(value) {
                    out.insert(path, literal);
                }
            }
        }
    }
}
