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
