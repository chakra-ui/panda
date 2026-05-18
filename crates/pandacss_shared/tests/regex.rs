use pandacss_shared::compile_js_regex;

#[test]
fn compiles_js_regex_flags() {
    let regex = compile_js_regex("^panda", "i").unwrap();

    assert!(regex.is_match("PandaBox"));
}
