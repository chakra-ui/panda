use pandacss_shared::stable_stringify;
use serde_json::json;

#[test]
fn sorts_object_keys_recursively() {
    let value = json!({ "b": 1, "a": { "z": true, "y": false } });
    assert_eq!(
        stable_stringify(&value),
        r#"{"a":{"y":false,"z":true},"b":1}"#
    );
}
