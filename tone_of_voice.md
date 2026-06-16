# Tone of voice

How we write anything users read — docs, guides, READMEs, changelogs, release notes, CLI output, error messages. Read
this before you write prose, and run the checklist before you ship it.

## The short version

Write like you're explaining it to one sharp person, out loud, with no time to waste. Plain words. Short sentences. Say
the thing.

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
- **Emoji bullet lists** used as decoration.
- **Over-bolding.** Bold stops meaning anything when half the line is bold. Bold the one word that matters, or none.
- **Em-dash pile-ups.** One thought per sentence; a period usually beats a dash.
- **Marketing title case.** Sentence case in headings reads human.

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
