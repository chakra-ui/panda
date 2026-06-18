# Tone of voice

How we write anything users read — docs, guides, READMEs, changelogs, release notes, CLI output, error messages. Read
this before you write prose, and run the checklist before you ship it.

## The short version

Write like you're explaining it to one sharp person, out loud, with no time to waste. Plain words. Short sentences. Say
the thing. 🐼

## Principles

1. **Write to one person.** Use "you". Talk to the reader like a colleague, not a crowd or a brand.
2. **Write like you talk.** Read it back aloud. If you wouldn't say it, rewrite it. Contractions are fine.
3. **Keep it short.** Prefer short words to long ones. One idea per sentence. Short paragraphs. Break up walls of text.
4. **Lead with the point.** Put it in the first sentence. Cut throat-clearing ("In this section we'll...", "It's worth
   noting that...").
5. **Be specific.** Names, numbers, exact commands, real examples. Vague claims ("powerful", "seamless", "robust") carry
   no information — delete them or replace them with the fact behind them.
6. **Cut the fluff.** Every word earns its place. If you can delete a word without losing meaning, delete it.
7. **Be honest.** Say what's rough, experimental, or unfinished, plainly. Candor builds more trust than polish.
8. **Keep them moving.** Each sentence should make the reader want the next one. No dead weight, no detours.
9. **Show, don't sell.** A code block or a concrete before/after beats any adjective.

## Cut these (the usual tells)

- **Hype words:** powerful, seamless, robust, blazing-fast, cutting-edge, effortless, unlock, elevate, leverage, delve,
  supercharge, next-level, game-changing.
- **Filler openers:** "In today's...", "When it comes to...", "It's important to note that...", "Let's dive in".
- **Padding transitions:** "Additionally", "Moreover", "Furthermore", "That said," used to connect nothing.
- **Over-hedging:** "arguably", "in many cases", "generally speaking" when you can just state it.
- **Emoji as decoration.** A purposeful one is fine (a ✅/❌, the odd 🐼). What to cut is rows of them dressing up every
  bullet or heading.
- **Over-bolding.** Bold stops meaning anything when half the line is bold. Bold the one word that matters, or none.
- **Em-dash pile-ups.** One thought per sentence; a period usually beats a dash.
- **Marketing title case.** Sentence case in headings reads human.

## Headings (docs)

Headings are signposts. The reader should know what they'll learn before they scroll. Write **complete phrases** — a
heading alone should answer "what is this section about?"

**Page title (`#`):** the feature or task. One line of description under it.

- Reference pages: name the feature — `Color opacity modifier`, `Button`, `Presets`
- Guides: name the outcome — `Accept a payment`, `Ship a Panda preset`, `Install Panda`

**Major sections (`##`):** group the page by job or surface.

- `Examples` — walkthroughs and code samples for a reference page
- `API Reference` — props, options, config keys
- `Usage in utilities` — where the feature applies in day-to-day styling
- `Customizing your theme` — config and extension

**Subsections (`###`):** one scenario, prop, or variant per heading. Prefer a verb or "Using …" over a bare noun.

| Pattern | When to use it | Example |
| -------- | --------------- | ------- |
| Basic example | First, simplest case | `Basic example` |
| Gerund phrase | A specific technique | `Changing the opacity`, `Applying on hover` |
| Using … | Custom or advanced input | `Using a custom value`, `Using createColorMixTransform` |
| Usage in … | Where something applies | `Usage in CSS custom properties`, `Usage in custom utilities` |
| Usage with … | Pairs with another concept | `Usage with virtual colors`, `Usage with recipes` |
| Usage at … | Timing or environment | `Usage at runtime` |
| Prop or option name | API docs, one knob per section | `Size`, `Variant`, `presets` |
| With … | Composition | `With icons`, `With virtual colors` |

**Patterns to avoid:**

- **Preposition-only headings** — `In CSS custom properties`, `With virtual colors` (incomplete alone)
- **Bare feature names** — `CSS custom properties`, `Runtime`, `Custom utilities` (no context)
- **Vague labels** — `Overview`, `Advanced`, `More`, `Notes` (say what's inside)
- **Title Case Every Word** — reads like marketing, not docs

Match depth to content: one `##` per major topic, `###` for variants. If a section runs longer than a few paragraphs,
split it with a heading.

**Before / after:**

- ❌ `## CSS custom properties`
- ✅ `## Usage in CSS custom properties`

- ❌ `### Runtime`
- ✅ `### Usage at runtime`

- ❌ `## Advanced`
- ✅ `## Usage in custom utilities`

## Before / after

- ❌ "Panda v2 introduces a powerful, blazing-fast Rust engine that seamlessly unlocks next-level performance."
- ✅ "v2 rewrites the compiler's hot path in Rust. One parse per file, no TypeScript program in the hot path."

- ❌ "It's worth noting that, in many cases, you may want to consider pinning your version."
- ✅ "Want reproducible installs? Pin an exact version."

## Checklist before you ship copy

- Could you read it aloud without wincing?
- Is the first sentence the point?
- Any word you can delete without losing meaning? Delete it.
- Any claim without a specific behind it? Add the specific, or cut the claim.
- Did you say what's still rough or unfinished?
