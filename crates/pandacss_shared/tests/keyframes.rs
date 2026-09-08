use pandacss_shared::{InlineKeyframe, keyframes_base_name, keyframes_name};
use serde_json::json;

#[test]
fn name_hashes_the_stops_and_ignores_key_order() {
    let stops = json!({ "from": { "opacity": 0 }, "to": { "opacity": 1 } });
    let name = keyframes_name(&stops, "");
    assert!(name.starts_with("kf_"));
    let reordered = json!({ "to": { "opacity": 1 }, "from": { "opacity": 0 } });
    assert_eq!(name, keyframes_name(&reordered, ""));
}

#[test]
fn prefix_joins_before_kf() {
    let stops = json!({ "from": { "opacity": 0 } });
    let base = keyframes_base_name(&stops);
    assert_eq!(keyframes_name(&stops, "p"), format!("p-{base}"));
}

#[test]
fn inline_keyframe_carries_name_and_stops() {
    let stops = json!({ "from": { "opacity": 0 }, "to": { "opacity": 1 } });
    let kf = InlineKeyframe::from_options(&stops, "");
    assert_eq!(kf.name, keyframes_name(&stops, ""));
    assert_eq!(kf.stops, stops);
    assert!(!kf.is_empty());
}

#[test]
fn empty_block_is_reported_empty() {
    assert!(InlineKeyframe::from_options(&json!({}), "").is_empty());
}
