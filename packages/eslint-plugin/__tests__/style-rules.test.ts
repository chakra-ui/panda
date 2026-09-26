import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  importMap: { css: ['@panda/css'] },
  theme: {
    tokens: { colors: { red: { 500: { value: '#f00' } } }, spacing: { 4: { value: '1rem' } } },
    textStyles: { heading: { value: { fontSize: '2xl', fontWeight: 'bold' } } },
  },
  utilities: {
    color: { className: 'c', values: 'colors' },
    margin: { className: 'm', shorthand: 'm' },
    marginInline: { className: 'mx', shorthand: 'mx' },
    marginTop: { className: 'mt', shorthand: 'mt' },
    marginLeft: { className: 'ml', shorthand: 'ml' },
    marginInlineStart: { className: 'ms' },
    padding: { className: 'p', shorthand: 'p' },
    gap: { className: 'gap' },
    left: { className: 'left' },
    insetInlineStart: { className: 'start' },
    fontSize: { className: 'fs' },
    fontWeight: { className: 'fw' },
    lineHeight: { className: 'lh' },
  },
}`)

ruleTester.run('no-important', {
  valid: [{ filename: 'app.tsx', code: withCss("css({ color: 'red.500' })") }],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ color: 'red.500!' })"),
      errors: [{ message: 'Avoid `!important`; it escalates specificity and is hard to override.' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ _hover: { color: 'red.500 !important' } })"),
      errors: [{ message: 'Avoid `!important`; it escalates specificity and is hard to override.' }],
    },
  ],
})

ruleTester.run('no-margin-properties', {
  valid: [{ filename: 'app.tsx', code: withCss("css({ padding: '4', gap: '4' })") }],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ mt: '4' })"),
      errors: [{ message: 'Avoid margin properties; prefer `gap` or a layout pattern for spacing.' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ marginInline: '4' })"),
      errors: [{ message: 'Avoid margin properties; prefer `gap` or a layout pattern for spacing.' }],
    },
  ],
})

ruleTester.run('no-physical-properties', {
  valid: [{ filename: 'app.tsx', code: withCss("css({ insetInlineStart: '0', marginInlineStart: '4' })") }],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ left: '0' })"),
      errors: [{ message: 'Use the logical property "insetInlineStart" instead of the physical "left".' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ ml: '4' })"),
      errors: [{ message: 'Use the logical property "marginInlineStart" instead of the physical "marginLeft".' }],
    },
  ],
})

ruleTester.run('prefer-text-style', {
  valid: [
    // A single typography property is fine.
    { filename: 'app.tsx', code: withCss("css({ fontSize: '2xl', color: 'red.500' })") },
  ],
  invalid: [
    {
      filename: 'app.tsx',
      code: withCss("css({ fontSize: '2xl', fontWeight: 'bold' })"),
      errors: [{ message: 'Multiple typography properties set together; prefer a `textStyle` token.' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ _hover: { fontSize: '2xl', lineHeight: '1.2' } })"),
      errors: [{ message: 'Multiple typography properties set together; prefer a `textStyle` token.' }],
    },
  ],
})
