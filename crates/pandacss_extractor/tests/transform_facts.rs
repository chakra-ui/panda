use crate::common::panda_config;
use indoc::indoc;
use insta::{assert_debug_snapshot, assert_yaml_snapshot};
use pandacss_extractor::extract_for_transform;
use serde_json::json;

#[test]
fn records_statement_context_through_an_arrow_body_comment() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        const styles = () => /* object */ css.raw({ color: 'red' });
    "};
    let result = extract_for_transform(source, "fixture.ts", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_debug_snapshot!(result.calls[0].facts.object_literal_context, @"StatementStart");
}

#[test]
fn records_expression_context_for_a_call_argument() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        accept(css.raw({ color: 'red' }));
    "};
    let result = extract_for_transform(source, "fixture.ts", &panda_config());
    assert!(result.diagnostics.is_empty());
    assert_debug_snapshot!(result.calls[0].facts.object_literal_context, @"Expression");
}

#[test]
fn records_context_and_scalar_keys_for_local_raw_calls() {
    let source = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        const raw = () => /* object */ styles.raw({ size: (0x10 as const), enabled: false, label: '  wide  ' });
    "};
    let result = extract_for_transform(source, "fixture.ts", &panda_config());
    assert!(result.diagnostics.is_empty());
    let call = &result.module.local_call_bindings[0].raw_calls[0];
    assert_debug_snapshot!(call.object_literal_context, @"StatementStart");
    let object = call.args[0].as_ref().unwrap().object.as_ref().unwrap();
    let properties = &object.properties;
    assert_yaml_snapshot!(json!({
        "size": properties[0].value.as_ref().unwrap().static_scalar_key,
        "enabled": properties[1].value.as_ref().unwrap().static_scalar_key,
        "label": properties[2].value.as_ref().unwrap().static_scalar_key,
    }), @r#"
    size: "16"
    enabled: "false"
    label: "  wide  "
    "#);
}

#[test]
fn leaves_unsupported_and_runtime_values_without_scalar_keys() {
    let source = indoc! {r"
        import { cva } from '@panda/css';
        const styles = cva({ base: { color: 'red' } });
        const raw = styles.raw({ size: props.size, pattern: /sm/, large: 1n });
    "};
    let result = extract_for_transform(source, "fixture.ts", &panda_config());
    assert!(result.diagnostics.is_empty());
    let call = &result.module.local_call_bindings[0].raw_calls[0];
    let object = call.args[0].as_ref().unwrap().object.as_ref().unwrap();
    let properties = &object.properties;
    assert_yaml_snapshot!(json!({
        "size": properties[0].value.as_ref().unwrap().static_scalar_key,
        "pattern": properties[1].value.as_ref().unwrap().static_scalar_key,
        "large": properties[2].value.as_ref().unwrap().static_scalar_key,
    }), @"
    size: ~
    pattern: ~
    large: ~
    ");
}
