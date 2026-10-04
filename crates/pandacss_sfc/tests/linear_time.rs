//! Inputs that once made a scan restart at every `{`, `{{`, `<` or `<!--`. Each
//! runs at 512 KB: a linear scan takes milliseconds even in a debug build, while
//! a quadratic one takes minutes, so the generous budget never flakes.

use std::time::{Duration, Instant};

const SIZE: usize = 512 * 1024;
const BUDGET: Duration = Duration::from_secs(5);

fn repeat(unit: &str) -> String {
    unit.repeat(SIZE / unit.len())
}

fn assert_linear(name: &str, source: &str, mask: impl Fn(&str) -> String) {
    let start = Instant::now();
    let canvas = mask(source);
    let elapsed = start.elapsed();
    // Astro may append one `]` past the source; nothing else moves.
    assert!(canvas.len() - source.len() <= 1, "{name}: offsets moved");
    assert!(
        elapsed < BUDGET,
        "{name}: {elapsed:?} for {} KB",
        source.len() / 1024
    );
}

fn svelte(name: &str, source: &str) {
    assert_linear(name, source, pandacss_sfc::svelte::mask);
}

fn vue(name: &str, source: &str) {
    assert_linear(name, source, pandacss_sfc::vue::mask);
}

fn astro(name: &str, source: &str) {
    assert_linear(name, source, |source| {
        pandacss_sfc::astro::lower(source).canvas
    });
}

#[test]
fn svelte_scans_stay_linear() {
    svelte("unclosed braces in text", &repeat("{ a "));
    svelte("unclosed braces with slashes", &repeat("{ a / b "));
    svelte(
        "unclosed braces in a tag",
        &format!("<p {}>", repeat("class={a ")),
    );
    svelte("unclosed block closers", &repeat("{/if "));
    svelte("unclosed comments", &repeat("<!-- { "));
    svelte("unbalanced quotes in tags", &repeat("<a ' {x} "));
    svelte("bare less-than signs", &repeat("<p>{a < b}</p>"));
    svelte(
        "many expressions",
        &repeat("<p class={css({ a: 1 })}>{x}</p>\n"),
    );
    svelte(
        "deeply nested braces",
        &format!("<p>{}{}</p>", "{(".repeat(SIZE / 8), ")}".repeat(SIZE / 8)),
    );
    svelte("unclosed scripts", &repeat("<script>a"));
    svelte(
        "closing tags without brackets",
        &format!("<style>{}", repeat("</style ")),
    );
    svelte("adjacent expressions", &format!("<p>{}</p>", repeat("{x}")));
}

#[test]
fn vue_scans_stay_linear() {
    let template = |body: String| format!("<template>{body}</template>");
    vue("unclosed interpolations", &template(repeat("{{ a ")));
    vue(
        "unclosed interpolations with slashes",
        &template(repeat("{{ a / b ")),
    );
    vue("unclosed comments", &template(repeat("<!-- x ")));
    vue(
        "unclosed comments before the template",
        &format!("{}{}", repeat("<!-- "), template("x".into())),
    );
    vue("unbalanced quotes in tags", &template(repeat("<a ' ")));
    vue("bare less-than signs", &template(repeat("a < b ")));
    vue(
        "unclosed nested templates",
        &format!("<template>{}", repeat("<template>")),
    );
    vue(
        "v-pre subtrees",
        &template(format!("<div v-pre>{}</div>", repeat("<div>{{ x }}"))),
    );
    vue(
        "many bindings",
        &template(repeat("<p :class=\"css({ a: 1 })\">{{ x }}</p>\n")),
    );
    vue(
        "less-than inside interpolations",
        &template(repeat("{{ a.includes('<T') }}")),
    );
    vue("adjacent interpolations", &template(repeat("{{x}}")));
}

#[test]
fn astro_scans_stay_linear() {
    astro("unclosed comments", &repeat("<!-- >"));
    astro(
        "unclosed comments in an expression",
        &format!("{{<a/>{}}}", repeat("<!-- x ")),
    );
    astro(
        "bare less-than signs",
        &format!("<p>{}</p>", repeat("1 < 2 << a ")),
    );
    astro(
        "many attribute expressions",
        &repeat("<a href={`/p/${x}`} class={css({ a: 1 })}>x</a>\n"),
    );
}
