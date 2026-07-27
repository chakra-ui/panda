use pandacss_codegen::{erase_typescript_block, erase_typescript_expr, erase_typescript_program};

#[test]
fn erases_a_cast_and_constructor_generics_inside_a_function() {
    assert_eq!(
        erase_typescript_program("function f() {\n  const set = new Set<string>()\n  return value as T\n}"),
        "function f() {\n  const set = new Set()\n  return value\n}"
    );
}

#[test]
fn erases_a_printed_function_body() {
    assert_eq!(
        erase_typescript_block("{\n  const out: any[] = []\n  return out as string[]\n}"),
        "{\n  const out = []\n  return out\n}"
    );
}

#[test]
fn erases_a_printed_expression() {
    assert_eq!(
        erase_typescript_expr("Object.assign(memo(function css(styles: Record<string, any> = {}) {\n  return styles\n}), { raw: 1 })"),
        "Object.assign(memo(function css(styles = {}) {\n  return styles\n}), { raw: 1 })"
    );
}

#[test]
fn drops_type_only_statements() {
    assert_eq!(
        erase_typescript_program("import type { A } from './a'\ninterface B { x: string }\ntype C = B\nexport const d = 1"),
        "\n\n\nexport const d = 1"
    );
}

#[test]
fn keeps_an_enum_because_it_has_runtime_semantics() {
    let source = "enum E { A = 1 }";
    assert_eq!(erase_typescript_program(source), source);
}
