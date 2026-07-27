use pandacss_codegen::{
    erase_typescript_block as erase_block, erase_typescript_expr as erase_expr,
    erase_typescript_program as erase,
};

#[test]
fn erases_a_cast_and_constructor_generics_inside_a_function() {
    assert_eq!(
        erase("function f() {\n  const set = new Set<string>()\n  return value as T\n}"),
        "function f() {\n  const set = new Set()\n  return value\n}"
    );
}

#[test]
fn erases_a_printed_function_body() {
    assert_eq!(
        erase_block("{\n  const out: any[] = []\n  return out as string[]\n}"),
        "{\n  const out = []\n  return out\n}"
    );
}

#[test]
fn erases_a_printed_expression() {
    assert_eq!(
        erase_expr(
            "Object.assign(memo(function css(styles: Record<string, any> = {}) {\n  return styles\n}), { raw: 1 })"
        ),
        "Object.assign(memo(function css(styles = {}) {\n  return styles\n}), { raw: 1 })"
    );
}

#[test]
fn drops_type_only_statements() {
    assert_eq!(
        erase(
            "import type { A } from './a'\ninterface B { x: string }\ntype C = B\nexport const d = 1"
        ),
        "\n\n\nexport const d = 1"
    );
}

#[test]
fn keeps_an_enum_because_it_has_runtime_semantics() {
    let source = "enum E { A = 1 }";
    assert_eq!(erase(source), source);
}

#[test]
fn strips_generated_type_annotations() {
    assert_eq!(
        erase(
            "const out: any[] = []\nconst fn: (...values: any[]) => any = function() {}\nconst arrow = (value: any, paths: string[]) => value"
        ),
        "const out = []\nconst fn = function() {}\nconst arrow = (value, paths) => value"
    );
}

#[test]
fn strips_generated_casts_and_constructor_generics() {
    assert_eq!(
        erase("const set = new Set<string>()\nconst v = value as T"),
        "const set = new Set()\nconst v = value"
    );
}

#[test]
fn strips_weak_collection_constructor_generics() {
    assert_eq!(
        erase("const cache = new WeakMap<object, Record<string, any>>()"),
        "const cache = new WeakMap()"
    );
    assert_eq!(
        erase("const seen = new WeakSet<object>()"),
        "const seen = new WeakSet()"
    );
}

#[test]
fn preserves_strings_that_look_like_types() {
    assert_eq!(
        erase(r#"const value = "x: string as T""#),
        r#"const value = "x: string as T""#
    );
}

#[test]
fn strips_function_return_type() {
    assert_eq!(
        erase("function f(a: string): Foo {\n  return a\n}"),
        "function f(a) {\n  return a\n}"
    );
}

#[test]
fn keeps_ternary_colon_after_call() {
    assert_eq!(
        erase("const x = cond ? foo(a) : bar"),
        "const x = cond ? foo(a) : bar"
    );
}

#[test]
fn keeps_a_ternary_used_as_a_call_argument() {
    assert_eq!(
        erase("const C = forwardRef(isPlain ? plainRender : render)"),
        "const C = forwardRef(isPlain ? plainRender : render)"
    );
    assert_eq!(
        erase("createElement(props.as === void 0 ? Default : props.as, rest)"),
        "createElement(props.as === void 0 ? Default : props.as, rest)"
    );
}

#[test]
fn keeps_an_object_literal_inside_a_ternary() {
    assert_eq!(
        erase("const x = cond ? { a: 1, b: 2 } : fallback"),
        "const x = cond ? { a: 1, b: 2 } : fallback"
    );
}

#[test]
fn keeps_nullish_and_optional_chaining() {
    assert_eq!(
        erase("const x = a?.b ?? (c ? d : e)"),
        "const x = a?.b ?? (c ? d : e)"
    );
}

#[test]
fn keeps_a_nested_ternary_in_a_call_argument() {
    assert_eq!(
        erase("cx(a ? b : c ? d : e, f)"),
        "cx(a ? b : c ? d : e, f)"
    );
}

#[test]
fn keeps_a_ternary_nested_in_an_object_inside_a_call() {
    assert_eq!(
        erase("createElement(El, { className: on ? 'a' : 'b', ref })"),
        "createElement(El, { className: on ? 'a' : 'b', ref })"
    );
}

#[test]
fn strips_a_parameter_type_after_a_ternary_in_the_same_function() {
    assert_eq!(
        erase("function f(a: string) { return a ? 1 : 2 }\nfunction g(b: number) { return b }"),
        "function f(a) { return a ? 1 : 2 }\nfunction g(b) { return b }"
    );
}

#[test]
fn strips_a_return_type_but_keeps_a_ternary_that_looks_like_one() {
    assert_eq!(
        erase("function f(): string { return cond ? go(x) : stop }"),
        "function f() { return cond ? go(x) : stop }"
    );
}

#[test]
fn strips_optional_parameter() {
    assert_eq!(
        erase("const f = (path: string, fallback?: string) => path"),
        "const f = (path, fallback) => path"
    );
}

#[test]
fn keeps_regex_non_capturing_group() {
    assert_eq!(
        erase("return /^[0-9]+(?:px|em)?(?:!)?$/.test(v)"),
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

    assert_eq!(erase(&source), expected);
}

#[test]
fn strips_a_large_inline_object_literal_in_linear_time() {
    // A huge single-line token map is real codegen output. The parse is linear,
    // but the bound also catches a future eraser that rescans per cut.
    let entries: Vec<String> = (0..20_000)
        .map(|i| format!(r#""token.{i}":"value-{i}""#))
        .collect();
    let source = format!(
        "const tokens: Record<string, string> = {{{}}}",
        entries.join(",")
    );

    let start = std::time::Instant::now();
    let _ = erase(&source);
    assert!(
        start.elapsed() < std::time::Duration::from_millis(500),
        "erasing took {:?} for {} entries — expected roughly linear time",
        start.elapsed(),
        entries.len()
    );
}

#[test]
fn keeps_a_value_import_next_to_an_inline_type_specifier() {
    assert_eq!(
        erase("import { memo, type Options } from './helpers'\nexport const m = memo"),
        "import { memo } from './helpers'\nexport const m = memo"
    );
}

#[test]
fn keeps_a_value_export_next_to_an_inline_type_specifier() {
    assert_eq!(
        erase("const a = 1\ntype B = string\nexport { a, type B }"),
        "const a = 1\n\nexport { a }"
    );
}

#[test]
fn drops_an_export_type_statement() {
    assert_eq!(
        erase("export type { A } from './a'\nexport const b = 1"),
        "\nexport const b = 1"
    );
}

#[test]
fn drops_an_ambient_declaration() {
    assert_eq!(
        erase("declare function f(): void\nexport const g = 1"),
        "\nexport const g = 1"
    );
}

#[test]
fn erases_nested_generic_arguments() {
    assert_eq!(
        erase("const cache = new Map<string, Map<string, number>>()\nconst m = memo<string>(fn)"),
        "const cache = new Map()\nconst m = memo(fn)"
    );
}

#[test]
fn erases_a_generic_arrow_function() {
    assert_eq!(
        erase("const id = <T,>(value: T): T => value"),
        "const id = (value) => value"
    );
}

#[test]
fn erases_satisfies_and_as_const() {
    assert_eq!(
        erase("const a = { x: 1 } satisfies Record<string, number>\nconst b = ['x'] as const"),
        "const a = { x: 1 }\nconst b = ['x']"
    );
}

#[test]
fn erases_a_chain_of_non_null_assertions() {
    assert_eq!(erase("const x = a!.b!.c"), "const x = a.b.c");
}

#[test]
fn keeps_pure_annotations_next_to_erased_types() {
    assert_eq!(
        erase(
            "export const css = /* @__PURE__ */ Object.assign(memo(function css(styles: Record<string, any> = {}) {\n  return styles\n}), { raw: 1 as number })"
        ),
        "export const css = /* @__PURE__ */ Object.assign(memo(function css(styles = {}) {\n  return styles\n}), { raw: 1 })"
    );
}

#[test]
fn keeps_byte_offsets_correct_after_multibyte_characters() {
    assert_eq!(
        erase("const panda = '🐼 — ok'\nconst count: number = 1"),
        "const panda = '🐼 — ok'\nconst count = 1"
    );
}

#[test]
fn erases_annotations_on_defaulted_and_optional_parameters() {
    assert_eq!(
        erase("function f(a: string = 'x', b?: number, ...rest: string[]) {\n  return a\n}"),
        "function f(a = 'x', b, ...rest) {\n  return a\n}"
    );
}

#[test]
fn erases_an_annotation_on_an_object_literal_method() {
    assert_eq!(
        erase("const o = {\n  m(a: string): void {},\n  get n(): number {\n    return 1\n  },\n}"),
        "const o = {\n  m(a) {},\n  get n() {\n    return 1\n  },\n}"
    );
}

#[test]
fn keeps_a_ternary_inside_a_template_literal() {
    assert_eq!(
        erase("const s = `${cond ? 'a' : 'b'}-${x as string}`"),
        "const s = `${cond ? 'a' : 'b'}-${x}`"
    );
}

#[test]
fn keeps_type_looking_text_inside_a_comment() {
    assert_eq!(
        erase("// const a: string = 'x'\nconst b: number = 1"),
        "// const a: string = 'x'\nconst b = 1"
    );
}
