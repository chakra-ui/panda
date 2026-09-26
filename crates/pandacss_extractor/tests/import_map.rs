use indoc::indoc;
use insta::assert_yaml_snapshot;
use pandacss_extractor::{
    MatchCategory, Matcher, Matchers, NameMatcher, match_imports, scan_imports,
};

fn css_only(modules: &[&str]) -> Matchers {
    Matchers {
        css: Matcher {
            modules: modules.iter().map(|s| (*s).to_string()).collect(),
            names: NameMatcher::only(["css", "cva", "sva"]),
        },
        ..Default::default()
    }
}

fn all_categories_under(prefix: &str) -> Matchers {
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
        jsx_factories: None,
        ..Default::default()
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
fn relative_import_matches_configured_module_by_substring() {
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
fn matches_generated_outdir_relative_modules() {
    let scan = scan_imports(
        indoc! {r#"
            import { css } from "../../styled-system/css"
            import { token } from "../styled-system/tokens"
            import { stack } from "./styled-system/patterns"
        "#},
        "src/components/card.tsx",
    );
    assert_yaml_snapshot!(match_imports(&scan, &all_categories_under("styled-system")), @r#"
    - category: css
      module: "../../styled-system/css"
      name: css
      alias: css
      kind: named
    - category: tokens
      module: "../styled-system/tokens"
      name: token
      alias: token
      kind: named
    - category: pattern
      module: "./styled-system/patterns"
      name: stack
      alias: stack
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
fn matches_each_category_under_the_panda_prefix() {
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
    assert_yaml_snapshot!(match_imports(&scan, &all_categories_under("@panda")), @r#"
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
fn only_imports_from_configured_org_packages_match() {
    // `styled-system/recipes` and `@bar/org/patterns` are not configured.
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

// --- module-matching ambiguity ---
// Module matching is substring-based; on overlap the first category wins,
// in the order css, tokens, recipe, pattern, jsx.

#[test]
fn overlapping_modules_pick_css_over_recipe() {
    let scan = scan_imports("import { css } from '@panda/css';\n", "f.tsx");
    let matchers = Matchers {
        css: Matcher {
            modules: vec!["@panda".into()],
            names: NameMatcher::only(["css"]),
        },
        recipe: Matcher {
            modules: vec!["@panda".into()],
            names: NameMatcher::Any,
        },
        ..Default::default()
    };
    assert_yaml_snapshot!(match_imports(&scan, &matchers), @r#"
    - category: css
      module: "@panda/css"
      name: css
      alias: css
      kind: named
    "#);
}

#[test]
fn overlapping_modules_pick_tokens_before_recipe() {
    let scan = scan_imports("import { token } from '@panda/tokens';\n", "f.tsx");
    let matchers = Matchers {
        tokens: Matcher {
            modules: vec!["@panda".into()],
            names: NameMatcher::only(["token"]),
        },
        recipe: Matcher {
            modules: vec!["@panda".into()],
            names: NameMatcher::Any,
        },
        ..Default::default()
    };
    assert_yaml_snapshot!(match_imports(&scan, &matchers), @r#"
    - category: tokens
      module: "@panda/tokens"
      name: token
      alias: token
      kind: named
    "#);
}

#[test]
fn org_scoped_module_matches_a_shorter_configured_module() {
    let scan = scan_imports("import { css } from '@my-co/panda-css';\n", "f.tsx");
    let matchers = Matchers {
        css: Matcher {
            modules: vec!["panda-css".into()],
            names: NameMatcher::only(["css"]),
        },
        ..Default::default()
    };
    let result = match_imports(&scan, &matchers);
    assert_eq!(result.len(), 1, "substring match should find css import");
    assert_eq!(result[0].category, MatchCategory::Css);
}

#[test]
fn one_letter_configured_module_matches_unrelated_packages() {
    let scan = scan_imports(
        "import { unrelated } from 'totally-unrelated-package';\n",
        "f.tsx",
    );
    let matchers = Matchers {
        css: Matcher {
            modules: vec!["a".into()],
            names: NameMatcher::Any,
        },
        ..Default::default()
    };
    assert_eq!(match_imports(&scan, &matchers).len(), 1);
}
