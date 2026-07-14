use pandacss_codegen::strip_typescript;

#[test]
fn strips_generated_type_annotations() {
    assert_eq!(
        strip_typescript(
            "const out: any[] = []\nconst fn: (...values: any[]) => any = function() {}\nconst arrow = (value: any, paths: string[]) => value"
        ),
        "const out = []\nconst fn = function() {}\nconst arrow = (value, paths) => value"
    );
}

#[test]
fn strips_generated_casts_and_constructor_generics() {
    assert_eq!(
        strip_typescript("const set = new Set<string>()\nreturn value as T"),
        "const set = new Set()\nreturn value"
    );
}

#[test]
fn strips_weak_collection_constructor_generics() {
    assert_eq!(
        strip_typescript("const cache = new WeakMap<object, Record<string, any>>()"),
        "const cache = new WeakMap()"
    );
    assert_eq!(
        strip_typescript("const seen = new WeakSet<object>()"),
        "const seen = new WeakSet()"
    );
}

#[test]
fn preserves_strings_that_look_like_types() {
    assert_eq!(
        strip_typescript(r#"const value = "x: string as T""#),
        r#"const value = "x: string as T""#
    );
}

#[test]
fn strips_function_return_type() {
    assert_eq!(
        strip_typescript("function f(a: string): Foo {\n  return a\n}"),
        "function f(a){\n  return a\n}"
    );
}

#[test]
fn keeps_ternary_colon_after_call() {
    assert_eq!(
        strip_typescript("const x = cond ? foo(a) : bar"),
        "const x = cond ? foo(a) : bar"
    );
}

#[test]
fn strips_optional_parameter() {
    assert_eq!(
        strip_typescript("const f = (path: string, fallback?: string) => path"),
        "const f = (path, fallback) => path"
    );
}

#[test]
fn keeps_regex_non_capturing_group() {
    assert_eq!(
        strip_typescript("return /^[0-9]+(?:px|em)?(?:!)?$/.test(v)"),
        "return /^[0-9]+(?:px|em)?(?:!)?$/.test(v)"
    );
}

#[test]
fn preserves_a_large_inline_object_literal_with_many_colons() {
    let entries: Vec<String> = (0..2000)
        .map(|i| format!(r#""token.{i}":"value-{i}""#))
        .collect();
    let source = format!(
        "const tokens: Record<string, string> = {{{}}}",
        entries.join(",")
    );
    let expected = format!("const tokens = {{{}}}", entries.join(","));

    assert_eq!(strip_typescript(&source), expected);
}

#[test]
fn strips_a_large_inline_object_literal_in_linear_time() {
    // Regression guard: `should_strip_variable_type` used to re-walk the whole
    // line's start on every `:`, making this quadratic in the entry count —
    // a huge single-line token map (real codegen output) took tens of
    // milliseconds. A generous bound still catches that regression by a wide
    // margin without flaking on a merely slow CI machine.
    let entries: Vec<String> = (0..20_000)
        .map(|i| format!(r#""token.{i}":"value-{i}""#))
        .collect();
    let source = format!(
        "const tokens: Record<string, string> = {{{}}}",
        entries.join(",")
    );

    let start = std::time::Instant::now();
    let _ = strip_typescript(&source);
    assert!(
        start.elapsed() < std::time::Duration::from_millis(500),
        "strip_typescript took {:?} for {} entries — expected roughly linear time",
        start.elapsed(),
        entries.len()
    );
}
