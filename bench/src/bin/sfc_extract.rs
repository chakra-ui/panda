#![allow(
    clippy::cast_precision_loss,
    clippy::disallowed_macros,
    clippy::print_stdout,
    reason = "benchmark binaries intentionally print JSON timing output"
)]

//! Extraction over `.astro`, `.svelte` and `.vue` files: template size, client
//! script count (with and without Panda imports), nesting depth and unclosed comments. Compare
//! `usPerKb` across sizes of one scenario: it should stay flat.

use std::fmt::Write as _;
use std::time::Instant;

use pandacss_extractor::{ExtractorConfig, Matcher, Matchers, NameMatcher, extract};
use serde_json::json;

const KB: usize = 1024;

fn config() -> ExtractorConfig {
    ExtractorConfig::new(Matchers {
        css: Matcher {
            modules: vec!["@panda/css".into()],
            names: NameMatcher::only(["css"]),
        },
        ..Default::default()
    })
}

const ASTRO_FRONTMATTER: &str =
    "---\nimport { css } from '@panda/css'\nconst items = ['a', 'b']\n---\n";

fn astro_template(bytes: usize) -> String {
    let mut source = String::from(ASTRO_FRONTMATTER);
    let mut i = 0;
    while source.len() < bytes {
        let _ = write!(
            source,
            "<section class={{css({{ padding: '{i}px' }})}} data-i=\"{i}\">\n  \
             {{items.map((item) => <li class={{css({{ color: 'green' }})}}>{{item}}</li>)}}\n  \
             <!-- note {i} --><p>{{`t ${{{i}}}`}} 1 < 2</p>\n</section>\n"
        );
        i += 1;
    }
    source
}

fn astro_scripts(count: usize, panda: bool) -> String {
    let mut source = astro_template(100 * KB);
    for i in 0..count {
        if panda {
            let _ = writeln!(
                source,
                "<script>import {{ css }} from '@panda/css'; css({{ color: 'c{i}' }})</script>"
            );
        } else {
            let _ = writeln!(source, "<script>document.title = 'page {i}'</script>");
        }
    }
    source
}

fn astro_unclosed_comments(bytes: usize) -> String {
    let mut source = String::from(ASTRO_FRONTMATTER);
    source.push_str("<p class={css({ color: 'red' })}>x</p>\n");
    while source.len() < bytes {
        source.push_str("<!-- a > text\n");
    }
    source
}

fn astro_nested(depth: usize) -> String {
    let mut source = String::from(ASTRO_FRONTMATTER);
    for level in 0..depth {
        let _ = write!(source, "<div class={{css({{ zIndex: {level} }})}}>");
    }
    source.push_str(&"</div>".repeat(depth));
    source
}

fn svelte(bytes: usize) -> String {
    let mut source = String::from(
        "<script>\n  import { css } from '@panda/css'\n  let open = true\n</script>\n",
    );
    let mut i = 0;
    while source.len() < bytes {
        let _ = write!(
            source,
            "<div class={{css({{ padding: '{i}px' }})}}>\n  \
             {{#if open}}<span>{{i / 2}}</span>{{/if}}<p class={{css({{ color: 'red' }})}}>x</p>\n  \
             <!-- c {i} -->\n</div>\n"
        );
        i += 1;
    }
    source.push_str("<style>.a { color: red }</style>\n");
    source
}

fn vue(bytes: usize) -> String {
    let mut source = String::from("<template>\n");
    let mut i = 0;
    while source.len() < bytes {
        let _ = write!(
            source,
            "  <div :class=\"css({{ padding: '{i}px' }})\" title=\"a\">\n    \
             <span v-if=\"open\">{{{{ count / 2 }}}}</span>\n    <!-- c {i} -->\n  </div>\n"
        );
        i += 1;
    }
    source.push_str(
        "</template>\n<script setup lang=\"ts\">\nimport { css } from '@panda/css'\n</script>\n",
    );
    source
}

struct Scenario {
    name: String,
    path: &'static str,
    source: String,
    /// The exact number of `css()` calls, where the fixture pins it.
    calls: Option<usize>,
}

fn scenario(name: impl Into<String>, path: &'static str, source: String) -> Scenario {
    Scenario {
        name: name.into(),
        path,
        source,
        calls: None,
    }
}

fn scenarios() -> Vec<Scenario> {
    let mut list = Vec::new();
    for kb in [25, 100, 400] {
        list.push(scenario(
            format!("astro-template-{kb}k"),
            "page.astro",
            astro_template(kb * KB),
        ));
    }
    // Each Panda script adds its one call; plain scripts add none.
    let template_calls = extract(&astro_template(100 * KB), "page.astro", &config())
        .calls
        .len();
    for count in [0, 1, 10, 100] {
        let mut panda = scenario(
            format!("astro-scripts-{count}-panda"),
            "page.astro",
            astro_scripts(count, true),
        );
        panda.calls = Some(template_calls + count);
        list.push(panda);
        let mut plain = scenario(
            format!("astro-scripts-{count}-plain"),
            "page.astro",
            astro_scripts(count, false),
        );
        plain.calls = Some(template_calls);
        list.push(plain);
    }
    for depth in [100, 200, 1_000] {
        list.push(scenario(
            format!("astro-nested-{depth}"),
            "page.astro",
            astro_nested(depth),
        ));
    }
    for kb in [25, 100] {
        list.push(scenario(
            format!("astro-unclosed-comments-{kb}k"),
            "page.astro",
            astro_unclosed_comments(kb * KB),
        ));
    }
    // A typo mid-edit: every later `{` / `{{` used to rescan to the end of the file.
    for kb in [25, 100] {
        let svelte_typo = format!(
            "{}<p>{{ a\n{}",
            svelte(kb * KB / 2),
            "<p>{x} {y}</p>\n".repeat(kb * KB / 32)
        );
        list.push(scenario(
            format!("svelte-unclosed-brace-{kb}k"),
            "Card.svelte",
            svelte_typo,
        ));
        let vue_typo = vue(kb * KB).replacen(
            "</template>",
            &format!("{}</template>", "{{ a ".repeat(kb * KB / 10)),
            1,
        );
        list.push(scenario(
            format!("vue-unclosed-interpolations-{kb}k"),
            "Card.vue",
            vue_typo,
        ));
    }
    for kb in [25, 100, 400] {
        list.push(scenario(
            format!("svelte-{kb}k"),
            "Card.svelte",
            svelte(kb * KB),
        ));
        list.push(scenario(format!("vue-{kb}k"), "Card.vue", vue(kb * KB)));
    }
    list
}

fn main() {
    let only = std::env::var("ONLY").ok();
    let config = config();
    for scenario in scenarios() {
        if only
            .as_deref()
            .is_some_and(|only| !scenario.name.contains(only))
        {
            continue;
        }
        let result = extract(&scenario.source, scenario.path, &config);
        assert!(
            !result.calls.is_empty(),
            "{}: no css() calls extracted",
            scenario.name
        );
        assert!(
            result.diagnostics.is_empty(),
            "{}: {:?}",
            scenario.name,
            result.diagnostics
        );
        if let Some(calls) = scenario.calls {
            assert_eq!(result.calls.len(), calls, "{}: css() calls", scenario.name);
        }

        let iterations = (4_000_000 / scenario.source.len()).clamp(10, 2_000);
        for _ in 0..iterations / 10 {
            let _ = extract(&scenario.source, scenario.path, &config);
        }
        let mut samples: Vec<f64> = (0..iterations)
            .map(|_| {
                let start = Instant::now();
                std::hint::black_box(extract(&scenario.source, scenario.path, &config));
                start.elapsed().as_secs_f64() * 1e6
            })
            .collect();
        samples.sort_by(f64::total_cmp);
        let median_us = samples[samples.len() / 2];
        let kb = scenario.source.len() as f64 / KB as f64;

        println!(
            "{}",
            json!({
                "scenario": scenario.name,
                "bytes": scenario.source.len(),
                "iterations": iterations,
                "medianUs": (median_us * 10.0).round() / 10.0,
                "usPerKb": (median_us / kb * 100.0).round() / 100.0,
                "calls": result.calls.len(),
                "diagnostics": result.diagnostics.len(),
            })
        );
    }
}
