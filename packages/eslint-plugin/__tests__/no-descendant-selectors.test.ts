import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { type Rule, RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import { createPandaPlugin } from '../src'
import type { RuleModuleLike } from '../src/rules/shared'

const hooks = RuleTester as unknown as {
  afterAll: typeof afterAll
  describe: typeof describe
  it: typeof it
  itOnly: typeof it.only
}
hooks.afterAll = afterAll
hooks.describe = describe
hooks.it = it
hooks.itOnly = it.only

const asRule = (rule: RuleModuleLike) => rule as unknown as Rule.RuleModule

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-descendant-selectors-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      importMap: { css: ['@panda/css'] },
      theme: { tokens: { colors: { red: { 500: { value: '#f00' } } } } },
      utilities: { color: { className: 'c', values: 'colors' } },
      conditions: { hover: '&:hover', groupHover: '.group:hover &' },
    }`,
  )
  return dir
}

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const dir = createTempProject()
const plugin = await createPandaPlugin({ cwd: dir })
const withCss = (...lines: string[]) => ["import { css } from '@panda/css'", ...lines].join('\n')

const message = (selector: string) =>
  `Selector "${selector}" styles another element. Keep styles on the element they belong to, or use a condition like "_groupHover" for cross-element state.`

ruleTester.run('no-descendant-selectors', asRule(plugin.rules['no-descendant-selectors']), {
  valid: [
    // A pseudo-class on the element itself stays scoped.
    { code: withCss("css({ '&:hover': { color: 'red.500' } })"), filename: join(dir, 'self-pseudo.tsx') },
    // A condition is the blessed cross-element form.
    { code: withCss("css({ _hover: { color: 'red.500' } })"), filename: join(dir, 'condition.tsx') },
    // Pseudo-elements belong to the element.
    { code: withCss("css({ '&::before': { color: 'red.500' } })"), filename: join(dir, 'pseudo-element.tsx') },
    // An attribute selector on self, even with a space inside the brackets.
    {
      code: withCss(`css({ '&[data-state="open item"]': { color: 'red.500' } })`),
      filename: join(dir, 'attr-self.tsx'),
    },
    // A class added to the same element is still self-targeting.
    { code: withCss("css({ '&.active': { color: 'red.500' } })"), filename: join(dir, 'self-class.tsx') },
    // :not() arguments can contain combinator characters without leaving the element.
    { code: withCss("css({ '&:not([data-x])': { color: 'red.500' } })"), filename: join(dir, 'not-arg.tsx') },
    // `.foo&` is a compound with `&`: the same element, written backwards.
    { code: withCss("css({ '.foo&': { color: 'red.500' } })"), filename: join(dir, 'compound-prefix.tsx') },
    // :is() may hold full complex selectors; combinators inside its parens stay shielded.
    {
      code: withCss("css({ '&:is(.dark > .panel *)': { color: 'red.500' } })"),
      filename: join(dir, 'is-complex-arg.tsx'),
    },
    // :has() looks at descendants but styles the element itself.
    { code: withCss("css({ '&:has(> img + figcaption)': { color: 'red.500' } })"), filename: join(dir, 'has-arg.tsx') },
    // An attribute value may contain a quoted bracket without corrupting depth tracking.
    {
      code: withCss(`css({ '&[data-content="]"]': { color: 'red.500' } })`),
      filename: join(dir, 'attr-quoted-bracket.tsx'),
    },
    // An attribute value may contain a comma; it is not a selector-list separator.
    {
      code: withCss(`css({ '&[data-tags="a,b"]': { color: 'red.500' } })`),
      filename: join(dir, 'attr-quoted-comma.tsx'),
    },
    // An escaped space in a class name is part of the name, not a combinator.
    { code: withCss("css({ '&.foo\\\\ bar': { color: 'red.500' } })"), filename: join(dir, 'escaped-space.tsx') },
    // `:is(&)` wraps the nesting selector without leaving the element.
    { code: withCss("css({ ':is(&):hover': { color: 'red.500' } })"), filename: join(dir, 'is-wrapped-amp.tsx') },
  ],
  invalid: [
    // A child combinator styles the children, not the element.
    {
      code: withCss("css({ '& > li': { color: 'red.500' } })"),
      filename: join(dir, 'child.tsx'),
      errors: [{ message: message('& > li') }],
    },
    // A descendant space reaches arbitrarily deep.
    {
      code: withCss("css({ '& li': { color: 'red.500' } })"),
      filename: join(dir, 'descendant.tsx'),
      errors: [{ message: message('& li') }],
    },
    // Sibling combinators style a different element too.
    {
      code: withCss("css({ '& + p': { color: 'red.500' } })"),
      filename: join(dir, 'sibling.tsx'),
      errors: [{ message: message('& + p') }],
    },
    // A parent-driven selector styles this element from another's state,
    // which is what conditions are for.
    {
      code: withCss("css({ '.group:hover &': { color: 'red.500' } })"),
      filename: join(dir, 'parent-driven.tsx'),
      errors: [{ message: message('.group:hover &') }],
    },
    // One offending part in a selector list is enough.
    {
      code: withCss("css({ '&:hover, & > li': { color: 'red.500' } })"),
      filename: join(dir, 'list.tsx'),
      errors: [{ message: message('&:hover, & > li') }],
    },
    // Combinators without surrounding spaces still leave the element.
    {
      code: withCss("css({ '&>li': { color: 'red.500' } })"),
      filename: join(dir, 'child-tight.tsx'),
      errors: [{ message: message('&>li') }],
    },
    // A sibling reference before `&` still spans two elements.
    {
      code: withCss("css({ 'input:checked ~ &': { color: 'red.500' } })"),
      filename: join(dir, 'sibling-of-amp.tsx'),
      errors: [{ message: message('input:checked ~ &') }],
    },
    // Selecting a descendant of :is() output leaves the element too.
    {
      code: withCss("css({ '&:is(.a, .b) span': { color: 'red.500' } })"),
      filename: join(dir, 'is-then-descendant.tsx'),
      errors: [{ message: message('&:is(.a, .b) span') }],
    },
  ],
})
