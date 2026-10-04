//! The Svelte and Vue masks against the official parsers. Each case records the
//! byte spans svelte@5.57.0 and @vue/compiler-sfc@3.5.42 read as JS. Every mask must:
//!
//! - keep the source's byte offsets and parse as TypeScript;
//! - copy every recorded expression and script body verbatim, at its own offsets;
//! - copy nothing else, apart from the `;` `(` `,` `)` it writes around expressions.
//!
//! `allowed` spans are the inside of each expression's braces, where parentheses and
//! comments around the expression may be copied too.

#![allow(
    clippy::single_range_in_vec_init,
    reason = "each array is a list of byte spans, not a range of indices"
)]

mod common;

use std::ops::Range;

use common::{check_mask_offsets, check_parses_as};
use oxc_span::SourceType;

struct Case {
    name: &'static str,
    source: &'static str,
    spans: &'static [Range<usize>],
    allowed: &'static [Range<usize>],
}

const SVELTE: &[Case] = &[
    Case {
        name: "text expression",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{count + 1}</p>",
        spans: &[8..44, 58..67],
        allowed: &[58..67],
    },
    Case {
        name: "attribute expression",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p class={css({ color: 'red' })}>x</p>",
        spans: &[8..44, 64..85],
        allowed: &[64..85],
    },
    Case {
        name: "shorthand attribute",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<input {value} />",
        spans: &[8..44, 62..67],
        allowed: &[63..66],
    },
    Case {
        name: "spread attribute",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<Button {...props} />",
        spans: &[8..44, 66..71],
        allowed: &[63..71],
    },
    Case {
        name: "expressions inside a quoted attribute",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p class=\"a {b} c {d}\">x</p>",
        spans: &[8..44, 67..68, 73..74],
        allowed: &[67..68, 73..74],
    },
    Case {
        name: "bind directive",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<input bind:value={name} />",
        spans: &[8..44, 73..77],
        allowed: &[73..77],
    },
    Case {
        name: "shorthand bind directive",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<input bind:value />",
        spans: &[8..44],
        allowed: &[],
    },
    Case {
        name: "on directive with modifiers",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<button on:click|once={() => count++}>+</button>",
        spans: &[8..44, 77..90],
        allowed: &[77..90],
    },
    Case {
        name: "class directive and shorthand",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p class:active={isActive} class:open>x</p>",
        spans: &[8..44, 71..79],
        allowed: &[71..79],
    },
    Case {
        name: "style directive",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p style:color={color} style:width=\"{size}px\">x</p>",
        spans: &[8..44, 70..75, 91..95],
        allowed: &[70..75, 91..95],
    },
    Case {
        name: "use directive",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<div use:tooltip={{ text: 'hi' }}></div>",
        spans: &[8..44, 72..86],
        allowed: &[72..86],
    },
    Case {
        name: "transition directive with an object",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<div transition:fade={{ duration: 200 }}></div>",
        spans: &[8..44, 76..93],
        allowed: &[76..93],
    },
    Case {
        name: "event attribute",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<button onclick={() => count++}>+</button>",
        spans: &[8..44, 71..84],
        allowed: &[71..84],
    },
    Case {
        name: "if, else if and else",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#if a > 1}<b class={css({ color: 'red' })}/>{:else if b}<i/>{:else}<u/>{/if}",
        spans: &[8..44, 59..64, 75..96, 109..110],
        allowed: &[55..64, 75..96, 100..110],
    },
    Case {
        name: "each with index, key and fallback",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#each items as item, i (item.id)}<li class={css({ zIndex: i })}>{item.name}</li>{:else}<p>none</p>{/each}",
        spans: &[8..44, 61..66, 99..117, 120..129],
        allowed: &[55..87, 99..117, 120..129],
    },
    Case {
        name: "each with destructuring",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#each pairs as [left, right]}<p>{left}{right}</p>{/each}",
        spans: &[8..44, 61..66, 88..92, 94..99],
        allowed: &[55..83, 88..92, 94..99],
    },
    Case {
        name: "await with then and catch blocks",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#await promise}<p>…</p>{:then value}<p>{value}</p>{:catch error}<p>{error.message}</p>{/await}",
        spans: &[8..44, 62..69, 97..102, 125..138],
        allowed: &[55..69, 97..102, 125..138],
    },
    Case {
        name: "await then shorthand",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#await promise then value}<p>{value}</p>{/await}",
        spans: &[8..44, 62..69, 85..90],
        allowed: &[55..80, 85..90],
    },
    Case {
        name: "await catch shorthand",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#await promise catch error}<p>{error}</p>{/await}",
        spans: &[8..44, 62..69, 86..91],
        allowed: &[55..81, 86..91],
    },
    Case {
        name: "key block",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#key id}<p class={css({ color: 'red' })}/>{/key}",
        spans: &[8..44, 60..62, 73..94],
        allowed: &[55..62, 73..94],
    },
    Case {
        name: "snippet and render",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#snippet row(item)}<td>{item}</td>{/snippet}{@render row(first)}",
        spans: &[8..44, 79..83, 108..118],
        allowed: &[79..83, 100..118],
    },
    Case {
        name: "html tag",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<div>{@html markup}</div>",
        spans: &[8..44, 66..72],
        allowed: &[60..72],
    },
    Case {
        name: "const tag",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#each items as item}{@const style = css({ color: item.color })}<p class={style}/>{/each}",
        spans: &[8..44, 61..66, 91..117, 128..133],
        allowed: &[55..74, 76..117, 128..133],
    },
    Case {
        name: "const tag with destructuring",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#each items as item}{@const { a } = item}<p>{a}</p>{/each}",
        spans: &[8..44, 61..66, 91..95, 100..101],
        allowed: &[55..74, 76..95, 100..101],
    },
    Case {
        name: "debug tag",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{@debug first, second}",
        spans: &[8..44, 62..75],
        allowed: &[55..75],
    },
    Case {
        name: "attach tag",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<div {@attach tooltip(content)}></div>",
        spans: &[8..44, 68..84],
        allowed: &[60..84],
    },
    Case {
        name: "svelte:head",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<svelte:head><title>{title}</title></svelte:head>",
        spans: &[8..44, 75..80],
        allowed: &[75..80],
    },
    Case {
        name: "svelte:window",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<svelte:window onkeydown={handle} />",
        spans: &[8..44, 80..86],
        allowed: &[80..86],
    },
    Case {
        name: "svelte:element",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<svelte:element this={tag} class={css({ color: 'red' })} />",
        spans: &[8..44, 76..79, 88..109],
        allowed: &[88..109],
    },
    Case {
        name: "module and instance scripts",
        source: "<script module>export const a = 1</script>\n<script>let b = 2</script>\n<p>{b}</p>",
        spans: &[15..33, 51..60, 74..75],
        allowed: &[74..75],
    },
    Case {
        name: "typescript script and expression",
        source: "<script lang=\"ts\">let v: string = ''</script>\n<p>{v as string}</p>",
        spans: &[18..36, 50..61],
        allowed: &[50..61],
    },
    Case {
        name: "generic script",
        source: "<script lang=\"ts\" generics=\"T extends { id: string }\">let { items }: { items: T[] } = $props()</script>\n<p>{items.length}</p>",
        spans: &[54..94, 108..120],
        allowed: &[108..120],
    },
    Case {
        name: "style with braces",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p class={a}>x</p>\n<style>.a { color: red } :global(.b) { margin: 0 }</style>",
        spans: &[8..44, 64..65],
        allowed: &[64..65],
    },
    Case {
        name: "comment hiding braces and a script tag",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<!-- {not} <script> -->\n<p>{shown}</p>",
        spans: &[8..44, 82..87],
        allowed: &[82..87],
    },
    Case {
        name: "string with a closing brace",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{'}'}</p>",
        spans: &[8..44, 58..61],
        allowed: &[58..61],
    },
    Case {
        name: "template literal with a closing brace",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{`a ${b} }`}</p>",
        spans: &[8..44, 58..68],
        allowed: &[58..68],
    },
    Case {
        name: "regex with a closing brace (#3836)",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p class={/\\}/.test(v) ? css({ color: 'red' }) : ''}/>",
        spans: &[8..44, 64..105],
        allowed: &[64..105],
    },
    Case {
        name: "closer followed by markup on one line",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#if open}<span>x</span>{/if}<div class={css({ color: 'red' })}>a</div>",
        spans: &[8..44, 59..63, 95..116],
        allowed: &[55..63, 95..116],
    },
    Case {
        name: "division after a postfix increment",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{n++ / 2}</p>",
        spans: &[8..44, 58..65],
        allowed: &[58..65],
    },
    Case {
        name: "crlf and multibyte text",
        source: "<script>\r\n  import { css } from '@panda/css'\r\n</script>\r\n<p title=\"✨\">{'🐼'} {label}</p>\r\n",
        spans: &[8..46, 73..79, 82..87],
        allowed: &[73..79, 82..87],
    },
    Case {
        name: "textarea value",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<textarea value={text}></textarea>",
        spans: &[8..44, 71..75],
        allowed: &[71..75],
    },
    Case {
        name: "component with slot content",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<Card><span slot=\"title\">{title}</span></Card>",
        spans: &[8..44, 80..85],
        allowed: &[80..85],
    },
    Case {
        name: "negated expressions",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<button disabled={!ready}>{!!count}</button>",
        spans: &[8..44, 72..78, 81..88],
        allowed: &[72..78, 81..88],
    },
    Case {
        name: "declaration tags",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#if open}{let count = $state(0), doubled = $derived(count * 2)}{const half = count / 2}<p>{doubled}{half}</p>{/if}",
        spans: &[8..44, 59..63, 77..117, 132..141, 146..153, 155..159],
        allowed: &[55..63, 65..117, 119..141, 146..153, 155..159],
    },
    Case {
        name: "const tag with a default value",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#each items as item}{@const { a = 1 } = item}<p>{a}</p>{/each}",
        spans: &[8..44, 61..66, 95..99, 104..105],
        allowed: &[55..74, 76..99, 104..105],
    },
    Case {
        name: "comment before an expression",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{/** @type {any} */ (value).name}</p>",
        spans: &[8..44, 77..89],
        allowed: &[58..89],
    },
    Case {
        name: "parenthesized expressions",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{(a, b)}</p><input {...({})} />",
        spans: &[8..44, 59..63, 81..83],
        allowed: &[58..64, 77..84],
    },
    Case {
        name: "whitespace before the closing bracket of a style tag",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<p>{a}</p>\n<style>\n\tp { color: red }\n</style   \n>",
        spans: &[8..44, 58..59],
        allowed: &[58..59],
    },
    Case {
        name: "script in svelte:head",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n<svelte:head><script src=\"https://cdn.test/{version}/x.js\"></script><script type=\"application/ld+json\">{ \"@type\": \"Thing\" }</script></svelte:head><p class={css({ color: 'red' })}>x</p>",
        spans: &[8..44, 98..105, 210..231],
        allowed: &[98..105, 210..231],
    },
    Case {
        name: "each over an as const array",
        source: "<script lang=\"ts\">\n  import { css } from '@panda/css'\n</script>\n{#each ['top', 'left'] as const as side}<p>{side}</p>{/each}",
        spans: &[18..54, 71..95, 108..112],
        allowed: &[65..103, 108..112],
    },
    Case {
        name: "each without as",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#each Array(3), i}<p>{i}</p>{/each}",
        spans: &[8..44, 61..69, 77..78],
        allowed: &[55..72, 77..78],
    },
    Case {
        name: "await then and catch without a value",
        source: "<script>\n  import { css } from '@panda/css'\n</script>\n{#await load() then}<p>done</p>{/await}{#await load() catch}<p>failed</p>{/await}",
        spans: &[8..44, 62..68, 101..107],
        allowed: &[55..73, 94..113],
    },
    Case {
        name: "less-than inside a text expression before the script",
        source: "<p>{a < b ? '<T' : ''}</p>\n<script>\n  import { css } from '@panda/css'\n</script>\n<p class={css({ color: 'red' })}>x</p>",
        spans: &[4..21, 35..71, 91..112],
        allowed: &[4..21, 91..112],
    },
    Case {
        name: "angle-bracket type assertion",
        source: "<script lang=\"ts\">\n  const flag = <boolean>true\n</script>\n<p>{flag}</p>",
        spans: &[18..48, 62..66],
        allowed: &[62..66],
    },
    Case {
        name: "arrow function in an attribute before the script",
        source: "<button onclick={() => count > 1}>+</button>\n<script>\n  import { css } from '@panda/css'\n</script>\n<p>{count}</p>",
        spans: &[17..32, 53..89, 103..108],
        allowed: &[17..32, 103..108],
    },
];

const VUE: &[Case] = &[
    Case {
        name: "interpolation",
        source: "<template><p>{{ count + 1 }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[16..25, 58..92],
        allowed: &[],
    },
    Case {
        name: "adjacent interpolations",
        source: "<template><p>{{ a }}{{ b }} and {{ c }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[16..17, 23..24, 35..36, 69..103],
        allowed: &[],
    },
    Case {
        name: "bound class",
        source: "<template><p :class=\"css({ color: 'red' })\">x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[21..42, 75..109],
        allowed: &[],
    },
    Case {
        name: "v-bind with an argument and an object",
        source: "<template><p v-bind:title=\"t\" v-bind=\"attrs\">x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[27..28, 38..43, 76..110],
        allowed: &[],
    },
    Case {
        name: "prop modifier",
        source: "<template><input :value.prop=\"v\" /></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[30..31, 61..95],
        allowed: &[],
    },
    Case {
        name: "array and object bindings",
        source: "<template><p :class=\"[a, b]\" :style=\"{ color: c }\">x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[21..27, 37..49, 82..116],
        allowed: &[],
    },
    Case {
        name: "event handlers",
        source: "<template><button @click=\"count++\" v-on:focus=\"onFocus($event)\" @keyup.enter=\"submit\">+</button></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[26..33, 47..62, 78..84, 122..156],
        allowed: &[],
    },
    Case {
        name: "multi-statement handler is skipped",
        source: "<template><button @click=\"a(); b()\">+</button></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[72..106],
        allowed: &[],
    },
    Case {
        name: "conditionals",
        source: "<template><p v-if=\"a > 1\">a</p><p v-else-if=\"b\">b</p><p v-else>c</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[19..24, 45..46, 94..128],
        allowed: &[],
    },
    Case {
        name: "v-show, v-model, v-html and v-text",
        source: "<template><input v-show=\"open\" v-model=\"name\" /><p v-html=\"markup\"></p><p v-text=\"label\"></p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[25..29, 40..44, 59..65, 82..87, 119..153],
        allowed: &[],
    },
    Case {
        name: "v-for over an array",
        source: "<template><li v-for=\"item in items\" :key=\"item.id\">{{ item.name }}</li></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[29..34, 42..49, 54..63, 97..131],
        allowed: &[],
    },
    Case {
        name: "v-for with index",
        source: "<template><li v-for=\"(item, index) in items\">{{ index }}</li></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[38..43, 48..53, 87..121],
        allowed: &[],
    },
    Case {
        name: "v-for over an object with of",
        source: "<template><li v-for=\"(value, key, index) of object\">{{ key }}</li></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[44..50, 55..58, 92..126],
        allowed: &[],
    },
    Case {
        name: "v-for over a range",
        source: "<template><span v-for=\"n in 10\">{{ n }}</span></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[28..30, 35..36, 72..106],
        allowed: &[],
    },
    Case {
        name: "v-for with destructuring",
        source: "<template><li v-for=\"{ id, name } in users\">{{ name }}</li></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[37..42, 47..51, 85..119],
        allowed: &[],
    },
    Case {
        name: "v-for source containing \" in \"",
        source: "<template><li v-for=\"item in items.filter((i) => i.tag !== ' in ')\">{{ item }}</li></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[29..66, 71..75, 109..143],
        allowed: &[],
    },
    Case {
        name: "scoped slots",
        source: "<template><List><template #default=\"{ item }\">{{ item }}</template><template v-slot:footer=\"props\">{{ props.n }}</template></List></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[36..44, 49..53, 92..97, 102..109, 156..190],
        allowed: &[],
    },
    Case {
        name: "dynamic arguments",
        source: "<template><p :[key]=\"value\" @[event]=\"handler\">x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[21..26, 38..45, 78..112],
        allowed: &[],
    },
    Case {
        name: "v-pre subtree",
        source: "<template><div v-pre><p :class=\"raw\">{{ not }}</p></div><p>{{ shown }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[62..67, 100..134],
        allowed: &[],
    },
    Case {
        name: "nested templates",
        source: "<template><template v-if=\"ok\"><p :class=\"css({ color: 'red' })\"/></template><p>{{ after }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[26..28, 41..62, 82..87, 120..154],
        allowed: &[],
    },
    Case {
        name: "script and script setup",
        source: "<script>\nexport default { name: 'Card' }\n</script>\n<template><p>{{ a }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[8..41, 67..68, 101..135],
        allowed: &[],
    },
    Case {
        name: "generic typescript script setup",
        source: "<script setup lang=\"ts\" generic=\"T extends Record<string, unknown>\">\ndefineProps<{ items: T[] }>()\n</script>\n<template><p>{{ items.length }}</p></template>",
        spans: &[68..99, 125..137],
        allowed: &[],
    },
    Case {
        name: "style with v-bind and a custom block",
        source: "<template><p class=\"a\">{{ a }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n<style scoped>.a { color: v-bind(color) }</style>\n<i18n>{ \"en\": { \"hi\": \"Hi\" } }</i18n>",
        spans: &[26..27, 60..94],
        allowed: &[],
    },
    Case {
        name: "comment hiding an interpolation",
        source: "<template><!-- {{ hidden }} <script> --><p>{{ shown }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[46..51, 84..118],
        allowed: &[],
    },
    Case {
        name: "greater-than inside an attribute value",
        source: "<template><p :title=\"a > b ? 'x' : 'y'\">x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[21..38, 71..105],
        allowed: &[],
    },
    Case {
        name: "unquoted attribute value",
        source: "<template><p :title=label>x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[20..25, 57..91],
        allowed: &[],
    },
    Case {
        name: "textarea interpolation",
        source: "<template><textarea>{{ text }}</textarea></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[23..27, 67..101],
        allowed: &[],
    },
    Case {
        name: "comment marker in an attribute value",
        source: "<template><p title=\"<!--\" :class=\"css({ color: 'red' })\">x</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[34..55, 88..122],
        allowed: &[],
    },
    Case {
        name: "interpolation ends at the first closing braces",
        source: "<template><p>{{ count }}}}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[16..21, 56..90],
        allowed: &[],
    },
    Case {
        name: "regex with a closing brace (#3836)",
        source: "<template><p :class=\"/\\}/.test(v) ? 'a' : 'b'\">{{ /\\}/.test(v) }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[21..45, 50..62, 95..129],
        allowed: &[],
    },
    Case {
        name: "crlf and multibyte text",
        source: "<template>\r\n  <p title=\"✨\">{{ '🐼' }} {{ label }}</p>\r\n</template>\r\n<script setup>\r\nimport { css } from '@panda/css'\r\n</script>\r\n",
        spans: &[32..38, 45..50, 86..122],
        allowed: &[],
    },
    Case {
        name: "pug template is not read",
        source: "<template lang=\"pug\">\np(:class=\"css({ color: 'red' })\") hi\n</template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[85..119],
        allowed: &[],
    },
    Case {
        name: "less-than inside an interpolation before the script",
        source: "<template><p>{{ value.includes('<T') ? 'a' : 'b' }}</p></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[16..48, 81..115],
        allowed: &[],
    },
    Case {
        name: "whitespace before the closing bracket of a script tag",
        source: "<template><p>{{ a }}</p></template>\n<script setup>\nconst a = 1\n</script   \n>",
        spans: &[16..17, 50..63],
        allowed: &[],
    },
    Case {
        name: "tsx script setup",
        source: "<script setup lang=\"tsx\">\nconst Icon = () => <svg />\n</script>\n<template><Icon :class=\"size\" /></template>",
        spans: &[25..53, 87..91],
        allowed: &[],
    },
    Case {
        name: "bare less-than in text before a component",
        source: "<template><p>a < b</p> a < b <Comp v-bind=\"css({ color: 'red' })\" /></template>\n<script setup>\nimport { css } from '@panda/css'\n</script>\n",
        spans: &[43..64, 94..128],
        allowed: &[],
    },
    Case {
        name: "angle-bracket type assertion",
        source: "<script setup lang=\"ts\">\nconst flag = <boolean>true\n</script>\n<template><p>{{ flag }}</p></template>",
        spans: &[24..52, 78..82],
        allowed: &[],
    },
];

/// The first problem with `mask` for `case`, or `None` when it matches the parser.
fn mismatch(case: &Case, mask: &str, source_type: SourceType) -> Option<String> {
    let source = case.source.as_bytes();
    let canvas = mask.as_bytes();
    if let Err(error) =
        check_mask_offsets(case.source, mask).and_then(|()| check_parses_as(mask, source_type))
    {
        return Some(error);
    }
    for span in case.spans {
        if canvas[span.clone()] != source[span.clone()] {
            return Some(format!(
                "expression {:?} at {span:?} was not copied: {:?}",
                &case.source[span.clone()],
                &mask[span.clone()]
            ));
        }
    }
    for (index, (&original, &masked)) in source.iter().zip(canvas).enumerate() {
        // Whitespace, and the bytes the mask writes, which may match the source
        // by chance, as the `;` of `&nbsp;` does.
        if masked.is_ascii_whitespace() || matches!(masked, b'(' | b')' | b';' | b',') {
            continue;
        }
        let inside = case
            .spans
            .iter()
            .chain(case.allowed)
            .any(|span| span.contains(&index));
        if masked == original && !inside {
            let line_start = case.source[..index].rfind('\n').map_or(0, |at| at + 1);
            return Some(format!(
                "byte {index} ({:?}) was copied but is not JS to the parser, in line {:?}",
                char::from(original),
                case.source[line_start..].lines().next().unwrap_or_default()
            ));
        }
        if masked != original {
            return Some(format!(
                "byte {index} was rewritten to {:?}",
                char::from(masked)
            ));
        }
    }
    None
}

fn assert_parity(
    framework: &str,
    cases: &[Case],
    mask: fn(&str) -> String,
    source_type: fn(&str) -> SourceType,
) {
    let failures: Vec<_> = cases
        .iter()
        .filter_map(|case| {
            mismatch(case, &mask(case.source), source_type(case.source))
                .map(|problem| format!("{}: {problem}", case.name))
        })
        .collect();
    assert!(
        failures.is_empty(),
        "{} of {} {framework} cases differ from the parser:\n{}",
        failures.len(),
        cases.len(),
        failures.join("\n")
    );
}

#[test]
fn svelte_mask_copies_exactly_what_the_svelte_parser_reads_as_js() {
    assert_parity("svelte", SVELTE, pandacss_sfc::svelte::mask, |_| {
        SourceType::ts()
    });
}

#[test]
fn vue_mask_copies_exactly_what_the_vue_parser_reads_as_js() {
    assert_parity("vue", VUE, pandacss_sfc::vue::mask, |source| {
        if pandacss_sfc::vue::uses_jsx(source) {
            SourceType::tsx()
        } else {
            SourceType::ts()
        }
    });
}
