import { createPandaRuleTester } from './panda-rule-tester'

// A design system mid-migration: deprecated tokens (one with a "use X instead"
// hint), a deprecated `opacity` utility, a deprecated `button` recipe, and a
// deprecated `stack` pattern — each also usable as a JSX component.
const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: {
    css: ['@panda/css'],
    tokens: ['@panda/tokens'],
    recipes: ['@panda/recipes'],
    patterns: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
  },
  conditions: { hover: '&:is(:hover)' },
  theme: {
    tokens: {
      colors: {
        red: { 500: { value: '#f00' } },
        old: { value: '#000', deprecated: true },
        legacy: { value: '#111', deprecated: 'use colors.red.500 instead' },
        // Both paths write --colors-text-neutral-main.
        text: {
          neutral: { main: { value: '#222' } },
          neutralMain: { value: '#222', deprecated: true },
        },
      },
    },
    recipes: {
      button: {
        className: 'button',
        jsx: ['Button'],
        base: {},
        variants: { size: { sm: {}, md: {} } },
        deprecated: 'use Action instead',
      },
    },
  },
  patterns: {
    stack: { jsxName: 'Stack', jsx: ['Stack'], properties: {}, transform: () => ({}), deprecated: 'use Flex instead' },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
    opacity: { className: 'op', deprecated: true },
  },
}`)

const tokenDeprecated = { message: 'Panda token "colors.old" is deprecated.' }

ruleTester.run('no-deprecated', {
  valid: [
    // Non-deprecated token, condition, and array — nothing to flag.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'red.500', _hover: { color: 'red.500' } })"].join('\n'),
    },
    // A deprecated alias that shares the token's CSS variable isn't what was written.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'text.neutral.main' })"].join('\n'),
    },
  ],
  invalid: [
    // token() call.
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "css({ color: token('colors.old') })",
      ].join('\n'),
      errors: [tokenDeprecated],
    },
    // token() call with an /opacity modifier.
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "css({ color: token('colors.old/40') })",
      ].join('\n'),
      errors: [tokenDeprecated],
    },
    // Bare category value.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'old' })"].join('\n'),
      errors: [tokenDeprecated],
    },
    // Bare category value with an /opacity modifier.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'old/40' })"].join('\n'),
      errors: [tokenDeprecated],
    },
    // Inside a condition.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ _hover: { color: 'old' } })"].join('\n'),
      errors: [tokenDeprecated],
    },
    // Inside a responsive array (only the deprecated entry is flagged).
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: ['old', 'red.500'] })"].join('\n'),
      errors: [tokenDeprecated],
    },
    // A deprecated alias is still flagged when it shares the token's CSS variable.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'text.neutralMain' })"].join('\n'),
      errors: [{ message: 'Panda token "colors.text.neutralMain" is deprecated.' }],
    },
    // Both aliases in one value: the deprecated one is still flagged.
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "css({ background: 'linear-gradient({colors.text.neutralMain}, {colors.text.neutral.main})' })",
      ].join('\n'),
      errors: [{ message: 'Panda token "colors.text.neutralMain" is deprecated.' }],
    },
    {
      filename: 'app.tsx',
      code: [
        "import { css } from '@panda/css'",
        "css({ background: 'linear-gradient({colors.text.neutral.main}, {colors.text.neutralMain})' })",
      ].join('\n'),
      errors: [{ message: 'Panda token "colors.text.neutralMain" is deprecated.' }],
    },
    // Token with an author message.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ color: 'legacy' })"].join('\n'),
      errors: [{ message: 'Panda token "colors.legacy" is deprecated. use colors.red.500 instead' }],
    },
    // Deprecated utility property.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ opacity: '0.5' })"].join('\n'),
      errors: [{ message: 'Panda property "opacity" is deprecated.' }],
    },
    // Deprecated recipe — function call and JSX component.
    {
      filename: 'app.tsx',
      code: ["import { button } from '@panda/recipes'", "button({ size: 'sm' })"].join('\n'),
      errors: [{ message: 'Panda recipe "button" is deprecated. use Action instead' }],
    },
    {
      filename: 'app.tsx',
      code: ["import { Button } from '@panda/jsx'", "const a = <Button size='sm' />"].join('\n'),
      errors: [{ message: 'Panda recipe "button" is deprecated. use Action instead' }],
    },
    // Deprecated pattern — function call and JSX component.
    {
      filename: 'app.tsx',
      code: ["import { stack } from '@panda/patterns'", 'stack({})'].join('\n'),
      errors: [{ message: 'Panda pattern "stack" is deprecated. use Flex instead' }],
    },
    {
      filename: 'app.tsx',
      code: ["import { Stack } from '@panda/jsx'", 'const a = <Stack />'].join('\n'),
      errors: [{ message: 'Panda pattern "stack" is deprecated. use Flex instead' }],
    },
    // `kinds` scopes the check: only tokens here, so the deprecated `opacity`
    // property is left alone.
    {
      filename: 'app.tsx',
      code: ["import { css } from '@panda/css'", "css({ opacity: '0.5', color: 'old' })"].join('\n'),
      options: [{ kinds: ['tokens'] }],
      errors: [tokenDeprecated],
    },
  ],
})
