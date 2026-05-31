mod common;

use common::create_project;
use indoc::indoc;
use insta::assert_snapshot;
use serde_json::json;

use pandacss_project::UsageSite;

/// One line per usage: `kind name` (ranges are covered by the binding tests).
fn summary(sites: &[UsageSite]) -> String {
    sites
        .iter()
        .map(|site| format!("{:?} {}", site.kind, site.name))
        .collect::<Vec<_>>()
        .join("\n")
}

fn project() -> pandacss_project::Project {
    create_project(json!({
        "theme": {
            "tokens": {
                "colors": { "red": { "300": { "value": "#f00" }, "500": { "value": "#e00" } } },
                "spacing": { "4": { "value": "1rem" } }
            },
            "keyframes": {
                "spin": { "from": {}, "to": {} },
                "fade": { "from": {}, "to": {} }
            }
        },
        "utilities": {
            "color": { "className": "c", "values": "colors" },
            "padding": { "className": "p", "shorthand": "p", "values": "spacing" }
        }
    }))
}

#[test]
fn bare_category_value_resolves_to_token() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'red.500' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property color
    Token colors.red.500
    ");
}

#[test]
fn shorthand_value_resolves_to_canonical_property_and_token() {
    let sites = project().usages("a.tsx", "import { css } from '@panda/css'\ncss({ p: '4' })");
    assert_snapshot!(summary(&sites), @r"
    Property padding
    Token spacing.4
    ");
}

#[test]
fn opacity_modifier_still_captures_the_base_token() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ color: 'red.300/40' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property color
    Token colors.red.300
    ");
}

#[test]
fn curly_reference_in_arbitrary_value_is_captured() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ '--ring': '{colors.red.500}' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property --ring
    Token colors.red.500
    ");
}

#[test]
fn curly_reference_with_opacity_modifier_is_captured() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ '--ring': '{colors.red.300/40}' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property --ring
    Token colors.red.300
    ");
}

#[test]
fn curly_reference_interpolated_in_longhand_value_is_captured() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ border: '1px solid {colors.red.300}' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property border
    Token colors.red.300
    ");
}

#[test]
fn token_fn_interpolated_in_longhand_value_is_captured() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ border: '1px solid token(colors.red.300)' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property border
    Token colors.red.300
    ");
}

#[test]
fn whole_value_token_path_is_captured() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ '--ring': 'colors.red.500' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property --ring
    Token colors.red.500
    ");
}

#[test]
fn token_fn_call_is_captured_via_resolved_var() {
    let sites = project().usages(
        "a.tsx",
        indoc! {r"
            import { css } from '@panda/css'
            import { token } from '@panda/tokens'
            css({ color: token('colors.red.500') })
        "},
    );
    assert_snapshot!(summary(&sites), @r"
    Property color
    Token colors.red.500
    ");
}

#[test]
fn animation_name_captures_keyframe() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animationName: 'spin' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property animationName
    Keyframe spin
    ");
}

#[test]
fn animation_name_captures_multiple_comma_separated_keyframes() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animationName: 'spin, fade' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property animationName
    Keyframe spin
    Keyframe fade
    ");
}

#[test]
fn animation_shorthand_captures_keyframe_anywhere_in_value() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animation: 'spin 1s linear infinite' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property animation
    Keyframe spin
    ");
}

#[test]
fn animation_shorthand_captures_multiple_keyframes() {
    let sites = project().usages(
        "a.tsx",
        "import { css } from '@panda/css'\ncss({ animation: 'spin 1s, fade 2s' })",
    );
    assert_snapshot!(summary(&sites), @r"
    Property animation
    Keyframe spin
    Keyframe fade
    ");
}
