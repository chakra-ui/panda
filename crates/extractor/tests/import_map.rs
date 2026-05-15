use extractor::{Matcher, Matchers, NameMatcher, match_imports, scan_imports};
use indoc::indoc;
use insta::assert_yaml_snapshot;

fn css_only(modules: &[&str]) -> Matchers {
    Matchers {
        css: Matcher {
            modules: modules.iter().map(|s| (*s).to_string()).collect(),
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        ..Default::default()
    }
}

fn panda_org(prefix: &str) -> Matchers {
    Matchers {
        css: Matcher {
            modules: vec![format!("{prefix}/css")],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: Matcher {
            modules: vec![format!("{prefix}/recipes")],
            names: NameMatcher::Any,
        },
        pattern: Matcher {
            modules: vec![format!("{prefix}/patterns")],
            names: NameMatcher::Any,
        },
        jsx: Some(Matcher {
            modules: vec![format!("{prefix}/jsx")],
            names: NameMatcher::only(["styled", "Box"]),
        }),
        tokens: Matcher {
            modules: vec![format!("{prefix}/tokens")],
            names: NameMatcher::only(["token"]),
        },
    }
}

#[test]
fn matches_named_alias_from_panda_css() {
    let scan = scan_imports("import { css as nCss } from '@panda/css'\n", "f.tsx");
    assert_yaml_snapshot!(match_imports(&scan, &css_only(&["@panda/css"])), @r#"
    - category: css
      module: "@panda/css"
      name: css
      alias: nCss
      kind: named
    "#);
}

#[test]
fn substring_match_on_module() {
    // JS uses includes(): "../styled-system/css" should match modules = ["styled-system/css"]
    let scan = scan_imports("import { css } from '../styled-system/css';\n", "f.tsx");
    assert_yaml_snapshot!(match_imports(&scan, &css_only(&["styled-system/css"])), @r#"
    - category: css
      module: "../styled-system/css"
      name: css
      alias: css
      kind: named
    "#);
}

#[test]
fn rejects_unknown_name_within_panda_module() {
    let scan = scan_imports("import { somethingElse } from '@panda/css'\n", "f.tsx");
    assert_yaml_snapshot!(match_imports(&scan, &css_only(&["@panda/css"])), @"[]");
}

#[test]
fn rejects_default_and_side_effect_imports() {
    let scan = scan_imports(
        indoc! {"
            import css from '@panda/css';
            import '@panda/css';
        "},
        "f.tsx",
    );
    assert_yaml_snapshot!(match_imports(&scan, &css_only(&["@panda/css"])), @"[]");
}

#[test]
fn skips_type_only_declarations_and_specifiers() {
    let scan = scan_imports(
        indoc! {"
            import type { css } from '@panda/css';
            import { type cva, sva } from '@panda/css';
        "},
        "f.tsx",
    );
    assert_yaml_snapshot!(match_imports(&scan, &css_only(&["@panda/css"])), @r#"
    - category: css
      module: "@panda/css"
      name: sva
      alias: sva
      kind: named
    "#);
}

#[test]
fn namespace_import_bypasses_name_allowlist() {
    let scan = scan_imports("import * as p from '@panda/css';\n", "f.tsx");
    assert_yaml_snapshot!(match_imports(&scan, &css_only(&["@panda/css"])), @r#"
    - category: css
      module: "@panda/css"
      name: "*"
      alias: p
      kind: namespace
    "#);
}

#[test]
fn matches_each_category_in_panda_org_layout() {
    let scan = scan_imports(
        indoc! {r#"
            import { css } from "@panda/css"
            import { token } from "@panda/tokens"
            import { cardStyle } from "@panda/recipes"
            import { stack } from "@panda/patterns"
            import { styled, Box } from "@panda/jsx"
        "#},
        "f.tsx",
    );
    assert_yaml_snapshot!(match_imports(&scan, &panda_org("@panda")), @r#"
    - category: css
      module: "@panda/css"
      name: css
      alias: css
      kind: named
    - category: tokens
      module: "@panda/tokens"
      name: token
      alias: token
      kind: named
    - category: recipe
      module: "@panda/recipes"
      name: cardStyle
      alias: cardStyle
      kind: named
    - category: pattern
      module: "@panda/patterns"
      name: stack
      alias: stack
      kind: named
    - category: jsx
      module: "@panda/jsx"
      name: styled
      alias: styled
      kind: named
    - category: jsx
      module: "@panda/jsx"
      name: Box
      alias: Box
      kind: named
    "#);
}

#[test]
fn js_parity_multiple_packages() {
    // Mirrors the import-map.test.ts multi-package fixture: only imports
    // matching the configured importMap should survive. Here the matcher
    // accepts `@acme/org/recipes` and `@bar/org/recipes` for recipes,
    // `@foo/org/css` for css, plus a pattern module — dropping the
    // non-matching `styled-system/recipes` and `@bar/org/patterns` (which
    // matches neither the configured recipe nor css modules).
    let scan = scan_imports(
        indoc! {r#"
            import { cardStyle } from "@acme/org/recipes"
            import { buttonStyle } from "@bar/org/recipes"
            import { css } from "@foo/org/css"
            import { tooltipStyle } from "styled-system/recipes"
            import { flex } from "@bar/org/patterns"
        "#},
        "f.tsx",
    );
    let matchers = Matchers {
        css: Matcher {
            modules: vec!["@acme/org/css".into(), "@foo/org/css".into()],
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        recipe: Matcher {
            modules: vec!["@acme/org/recipes".into(), "@bar/org/recipes".into()],
            names: NameMatcher::Any,
        },
        pattern: Matcher {
            modules: vec!["@acme/org/patterns".into()],
            names: NameMatcher::Any,
        },
        ..Default::default()
    };
    assert_yaml_snapshot!(match_imports(&scan, &matchers), @r#"
    - category: recipe
      module: "@acme/org/recipes"
      name: cardStyle
      alias: cardStyle
      kind: named
    - category: recipe
      module: "@bar/org/recipes"
      name: buttonStyle
      alias: buttonStyle
      kind: named
    - category: css
      module: "@foo/org/css"
      name: css
      alias: css
      kind: named
    "#);
}
