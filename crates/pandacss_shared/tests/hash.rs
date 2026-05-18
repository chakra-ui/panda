use pandacss_shared::to_hash;

#[test]
fn hashes_match_js_panda_hash() {
    assert_eq!(to_hash("spacing-sm"), "jolVMp");
    assert_eq!(to_hash("colors-red-500"), "iYfRb");
}
