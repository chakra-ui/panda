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
fn keeps_a_ternary_used_as_a_call_argument() {
    assert_eq!(
        strip_typescript("const C = forwardRef(isPlain ? plainRender : render)"),
        "const C = forwardRef(isPlain ? plainRender : render)"
    );
    assert_eq!(
        strip_typescript("createElement(props.as === void 0 ? Default : props.as, rest)"),
        "createElement(props.as === void 0 ? Default : props.as, rest)"
    );
}

#[test]
fn keeps_an_object_literal_inside_a_ternary() {
    assert_eq!(
        strip_typescript("const x = cond ? { a: 1, b: 2 } : fallback"),
        "const x = cond ? { a: 1, b: 2 } : fallback"
    );
}

#[test]
fn keeps_nullish_and_optional_chaining() {
    assert_eq!(
        strip_typescript("const x = a?.b ?? (c ? d : e)"),
        "const x = a?.b ?? (c ? d : e)"
    );
}

#[test]
fn keeps_a_nested_ternary_in_a_call_argument() {
    assert_eq!(
        strip_typescript("cx(a ? b : c ? d : e, f)"),
        "cx(a ? b : c ? d : e, f)"
    );
}

#[test]
fn keeps_a_ternary_nested_in_an_object_inside_a_call() {
    assert_eq!(
        strip_typescript("createElement(El, { className: on ? 'a' : 'b', ref })"),
        "createElement(El, { className: on ? 'a' : 'b', ref })"
    );
}

#[test]
fn strips_a_parameter_type_after_a_ternary_in_the_same_function() {
    assert_eq!(
        strip_typescript("function f(a: string) { return a ? 1 : 2 }\nfunction g(b: number) { return b }"),
        "function f(a) { return a ? 1 : 2 }\nfunction g(b) { return b }"
    );
}

#[test]
fn strips_a_return_type_but_keeps_a_ternary_that_looks_like_one() {
    assert_eq!(
        strip_typescript("function f(): string { return cond ? go(x) : stop }"),
        "function f(){ return cond ? go(x) : stop }"
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
