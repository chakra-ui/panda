use std::collections::BTreeMap;

use pandacss_config::UtilityConfig;
use serde_json::Value;

pub fn utility_config(value: Value) -> BTreeMap<String, UtilityConfig> {
    serde_json::from_value(value).expect("utility config")
}
