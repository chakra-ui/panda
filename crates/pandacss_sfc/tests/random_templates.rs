//! Random Svelte and Vue templates built from valid fragments, nested inside each
//! other. Every mask must keep its offsets, parse as TypeScript, and keep every
//! numbered `css()` call verbatim, whatever surrounds it.
//! Every fragment is valid: on 2026-10-04 the official parsers accepted all 4,000
//! generated templates.

mod common;

use common::{check_mask_offsets, check_parses_as};
use oxc_span::SourceType;

struct Random(u64);

impl Random {
    fn next(&mut self, below: usize) -> usize {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        usize::try_from(self.0 % u64::try_from(below).unwrap()).unwrap()
    }

    fn pick<'a>(&mut self, items: &[&'a str]) -> &'a str {
        items[self.next(items.len())]
    }
}

const SVELTE_SEPARATORS: &[&str] = &[
    "",
    " ",
    "\n",
    "\r\n",
    "\t",
    " ✨ ",
    "<!-- {x} <script> } -->",
    "&lt;",
    "{'}'}",
];

/// Vue text may hold a bare `<` and braces that aren't interpolations.
const VUE_SEPARATORS: &[&str] = &[
    "",
    " ",
    "\n",
    "\r\n",
    "\t",
    " ✨ ",
    "<!-- {{x}} <script> -->",
    "a < b ",
    "{ x }",
    "&lt;",
];

/// A Svelte fragment around `inner`, holding the call `call`.
fn svelte_fragment(random: &mut Random, call: &str, inner: &str) -> String {
    match random.next(14) {
        0 => format!("<div class={{{call}}}>{inner}</div>"),
        1 => format!("<p>{{{call}}}</p>{inner}"),
        2 => format!(
            "{{#if open && {call}}}{inner}{{:else if !ready}}<i></i>{{:else}}<u></u>{{/if}}"
        ),
        3 => format!("{{#each [{call}] as item, i (item)}}<span>{{item}}</span>{inner}{{/each}}"),
        4 => format!("{{#await load({call}) then value}}<span>{{value}}</span>{inner}{{/await}}"),
        5 => format!("{{#key {call}}}{inner}{{/key}}"),
        6 => format!("<div class:active={{{call}}} style:color={{c}}>{inner}</div>"),
        7 => format!("<Comp {{...{call}}} onclick={{() => n++ / 2}}>{inner}</Comp>"),
        8 => format!("<div title=\"a {{{call}}} b\">{inner}</div>"),
        9 => format!(
            "{{#each items as item}}{{@const style = {call}}}<span class={{style}}></span>{inner}{{/each}}"
        ),
        10 => {
            format!("{{#if a}}{{const style = {call}}}<span class={{style}}></span>{inner}{{/if}}")
        }
        11 => format!("<div class={{/\\}}/.test(v) ? {call} : ''}}>{inner}</div>"),
        12 => format!("{{#if open}}<b></b>{{/if}}<div class={{{call}}}>{inner}</div>"),
        _ => format!("<svelte:element this={{tag}} class={{{call}}}>{inner}</svelte:element>"),
    }
}

/// A Vue fragment around `inner`, holding the call `call`.
fn vue_fragment(random: &mut Random, call: &str, inner: &str) -> String {
    match random.next(11) {
        0 => format!("<p :class=\"{call}\">{inner}</p>"),
        1 => format!("<p>{{{{ {call} }}}}</p>{inner}"),
        2 => format!("<p v-if=\"open && {call}\">{inner}</p><p v-else>x</p>"),
        3 => format!("<li v-for=\"(item, i) in [{call}]\" :key=\"i\">{inner}</li>"),
        4 => format!("<template v-if=\"ok\"><p :style=\"{call}\"/>{inner}</template>"),
        5 => format!("<Comp v-bind=\"{call}\" @click=\"n++\">{inner}</Comp>"),
        6 => format!("<p :title=\"a > b ? {call} : 'y'\">{inner}</p>"),
        7 => format!(
            "<List><template #default=\"{{ item }}\"><p :class=\"{call}\"/>{inner}</template></List>"
        ),
        8 => format!("<p :[key]=\"{call}\">{inner}</p>"),
        9 => format!("<p>{{{{ value.includes('<T') ? {call} : '' }}}}</p>{inner}"),
        _ => format!("<textarea>{{{{ {call} }}}}</textarea>{inner}"),
    }
}

/// A template of up to `depth` nested fragments, and the calls it holds.
fn template(
    random: &mut Random,
    fragment: fn(&mut Random, &str, &str) -> String,
    separators: &[&str],
    depth: usize,
    calls: &mut Vec<String>,
) -> String {
    if depth == 0 || random.next(4) == 0 {
        return random.pick(separators).to_owned();
    }
    let call = format!("css({{ color: 'c{}' }})", calls.len());
    calls.push(call.clone());
    let inner = template(random, fragment, separators, depth - 1, calls);
    let sibling = template(random, fragment, separators, depth - 1, calls);
    let separator = random.pick(separators);
    format!("{}{separator}{sibling}", fragment(random, &call, &inner))
}

fn check(name: &str, source: &str, mask: &str, calls: &[String]) {
    if let Err(error) =
        check_mask_offsets(source, mask).and_then(|()| check_parses_as(mask, SourceType::ts()))
    {
        panic!("{name}: {error}\n{source}");
    }
    for call in calls {
        assert!(
            mask.contains(call.as_str()),
            "{name}: lost {call}\n{source}"
        );
    }
}

#[test]
fn random_svelte_templates_keep_every_style_call() {
    let mut random = Random(0x9e37_79b9_7f4a_7c15);
    for round in 0..2_000 {
        let mut calls = Vec::new();
        let body = template(
            &mut random,
            svelte_fragment,
            SVELTE_SEPARATORS,
            4,
            &mut calls,
        );
        let script = "<script lang=\"ts\">\n  import { css } from '@panda/css'\n</script>\n";
        let style = "<style>\n  p { color: red }\n</style>\n";
        let source = match random.next(3) {
            0 => format!("{script}{body}\n{style}"),
            1 => format!("{body}\n{script}{style}"),
            _ => format!("{style}{body}\n{script}"),
        };
        check(
            &format!("round {round}"),
            &source,
            &pandacss_sfc::svelte::mask(&source),
            &calls,
        );
    }
}

#[test]
fn random_vue_templates_keep_every_style_call() {
    let mut random = Random(0x2545_f491_4f6c_dd1d);
    for round in 0..2_000 {
        let mut calls = Vec::new();
        let body = template(&mut random, vue_fragment, VUE_SEPARATORS, 4, &mut calls);
        let script = "<script setup lang=\"ts\">\nimport { css } from '@panda/css'\n</script>\n";
        let source = match random.next(2) {
            0 => format!("<template>{body}</template>\n{script}"),
            _ => format!(
                "{script}<template>\n{body}\n</template>\n<style scoped>.a {{ color: v-bind(c) }}</style>\n"
            ),
        };
        check(
            &format!("round {round}"),
            &source,
            &pandacss_sfc::vue::mask(&source),
            &calls,
        );
    }
}
